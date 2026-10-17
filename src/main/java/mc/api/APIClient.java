package mc.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import mc.api.visualizer.ExtendedMatch;

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


    private static final String API_URL = "https://api.mcsrranked.com/matches/";

    public static ExtendedMatch getMatch(int matchId)
            throws IOException, InterruptedException {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL + matchId))
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

        if (!"success".equals(root.get("status").getAsString())) {
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
                || !root.get("data").isJsonObject()) {

            throw new IOException(
                    "MCSR Ranked API response is missing "
                            + "the 'data' object."
            );
        }

        JsonObject data = root.getAsJsonObject("data");


        String bastionType = null;
        String overworldType = null;

        if (data.has("seed")
                && data.get("seed").isJsonObject()) {

            JsonObject seed = data.getAsJsonObject("seed");

            if (seed.has("nether")
                    && !seed.get("nether").isJsonNull()) {
                bastionType = seed.get("nether").getAsString();
            }

            if (seed.has("overworld")
                    && !seed.get("overworld").isJsonNull()) {
                overworldType = seed.get("overworld").getAsString();
            }
        }


        /*
         * Build splits from timelines.
         */
        List<ExtendedMatch.Split> splits = new ArrayList<>();

        if (data.has("timelines")
                && data.get("timelines").isJsonArray()) {

            JsonArray timelines = data.getAsJsonArray("timelines");

            for (JsonElement element : timelines) {

                if (!element.isJsonObject()) {
                    continue;
                }

                JsonObject timeline = element.getAsJsonObject();

                if (!timeline.has("type")
                        || !timeline.has("time")) {
                    continue;
                }

                String type = timeline.get("type").getAsString();

                // API gives times in milliseconds.
                double time = timeline.get("time").getAsDouble() / 1000.0;

                String name = mapTimelineName(type);

                if (name != null) {
                    splits.add(
                            new ExtendedMatch.Split(name, time)
                    );
                }
            }

            splits.sort(
                    java.util.Comparator.comparingDouble(
                            ExtendedMatch.Split::time
                    )
            );
        }

        /*
         * Get final completion time.
         */
        double finalTime = 0;

        if (data.has("result")
                && data.get("result").isJsonObject()) {

            JsonObject result = data.getAsJsonObject("result");

            if (result.has("time")
                    && !result.get("time").isJsonNull()) {

                // API gives times in milliseconds.
                finalTime = result.get("time").getAsDouble() / 1000.0;
            }
        }


        return new ExtendedMatch(
                splits,
                bastionType,
                overworldType,
                finalTime
        );
    }

    private static String mapTimelineName(String type) {
        return switch (type) {
            case "story.enter_the_nether" ->
                    "Nether";

            case "story.follow_ender_eye" ->
                    "Stronghold";

            case "end.root" ->
                    "End";

            case "projectelo.timeline.dragon_death" ->
                    "Dragon";

            default ->
                    null;
        };
    }

    public static List<Match> getLastRankedMatches(
            String playerName,
            String urlIn,
            boolean sortByOldest,
            int numberOfMatches
    ) throws IOException, InterruptedException {

        String encodedPlayer =
                URLEncoder.encode(
                        playerName,
                        StandardCharsets.UTF_8
                );

        String url = urlIn
                + "/users/" + encodedPlayer + "/matches"
                + "?count=" + numberOfMatches
                + "&type=3"
                + "&excludedecay=true";

        if(sortByOldest)
            url += "&sort=oldest";

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
        return matches;
    }
}