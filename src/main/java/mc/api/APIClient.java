package mc.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class APIClient {

    private static final HttpClient HTTP_CLIENT =
            HttpClient.newHttpClient();

    public static List<Match> getLast100RankedMatches(
            String playerName,
            String urlIn
    ) throws IOException, InterruptedException {

        String encodedPlayer =
                URLEncoder.encode(
                        playerName,
                        StandardCharsets.UTF_8
                );

        String url = urlIn
                + "/users/" + encodedPlayer + "/matches"
                + "?count=100"
                + "&type=3"
                + "&excludedecay=true";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .header("Accept", "application/json")
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new IOException(
                    "MCSR Ranked API returned HTTP "
                            + response.statusCode()
                            + ": "
                            + response.body()
            );
        }

        JsonObject root = JsonParser
                .parseString(response.body())
                .getAsJsonObject();

        /*
         * Check API status.
         */
        if (!root.has("status")
                || root.get("status").isJsonNull()) {

            throw new IOException(
                    "MCSR Ranked API response is missing 'status': "
                            + response.body()
            );
        }

        String status = root.get("status").getAsString();

        if (!"success".equals(status)) {
            String errorData = root.has("data")
                    ? root.get("data").toString()
                    : "unknown error";

            throw new IOException(
                    "MCSR Ranked API returned an error: "
                            + errorData
            );
        }

        /*
         * Get match data.
         */
        if (!root.has("data")
                || !root.get("data").isJsonArray()) {

            throw new IOException(
                    "MCSR Ranked API response is missing "
                            + "the 'data' array."
            );
        }

        JsonArray data = root.getAsJsonArray("data");

        List<Match> matches = new ArrayList<>();

        for (JsonElement element : data) {

            if (!element.isJsonObject()) {
                continue;
            }

            JsonObject jsonMatch = element.getAsJsonObject();

            Match match = MatchParser.parseMatch(jsonMatch);

            /*
             * Ignore forfeited matches.
             *
             * According to the API documentation, "forfeited"
             * indicates that the match has no completions.
             */
            if (match.forfeited) {
                continue;
            }

            matches.add(match);
        }

        System.out.println("Match size: " + matches.size());

        return matches;
    }
}