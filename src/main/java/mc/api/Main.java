
package mc.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import mc.api.visualizer.ExtendedMatch;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class Main {

    public static void main(String[] args) throws Exception {

        String playerName = "SubToKanes";
        String url = "https://api.mcsrranked.com";

        List<Match> matchesNewest =
                APIClient.getLastRankedMatches(
                        playerName, url, false, 75
                );

        List<Match> matchesOldest =
                APIClient.getLastRankedMatches(
                        playerName, url, true, 75
                );

        List<Match> matches =
                removeDuplicates(matchesOldest, matchesNewest);

        System.out.println(
                "Total number of private room matches played: "
                        + matches.size()
        );

        List<ExtendedMatch> extendedMatches = new ArrayList<>();

        for (Match m : matches) {
            extendedMatches.add(
                    getDetailedRunInformation(m.id)
            );
        }

        writeRunsJson(extendedMatches);
    }

    private static ExtendedMatch getDetailedRunInformation(
            int matchId
    ) throws IOException, InterruptedException {
        return APIClient.getMatch(matchId);
    }

    private static void writeRunsJson(
            List<ExtendedMatch> matches
    ) throws IOException {

        File outputFile = new File(
                "src/main/java/mc/api/visualizer/runs.json"
        );

        File parent = outputFile.getParentFile();

        if (parent != null) {
            parent.mkdirs();
        }

        JsonArray runs = new JsonArray();

        for (ExtendedMatch match : matches) {

            JsonObject run = new JsonObject();

            // Final completion time in seconds.
            run.addProperty("time", match.time());

            // Bastion and Overworld types.
            run.addProperty(
                    "bastionType",
                    match.bastionType()
            );

            run.addProperty(
                    "overworldType",
                    match.overworldType()
            );

            // Split names and times.
            JsonArray splits = new JsonArray();

            for (ExtendedMatch.Split split : match.splits()) {

                JsonObject splitJson = new JsonObject();

                splitJson.addProperty("name", split.name());
                splitJson.addProperty("time", split.time());

                splits.add(splitJson);
            }

            run.add("splits", splits);

            runs.add(run);
        }

        try (FileWriter writer = new FileWriter(outputFile)) {
            writer.write(
                    new com.google.gson.GsonBuilder()
                            .setPrettyPrinting()
                            .create()
                            .toJson(runs)
            );
        }

        System.out.println(
                "Wrote runs to: " + outputFile.getCanonicalPath()
        );
    }

    private static List<Match> removeDuplicates(
            List<Match> matchesOldest,
            List<Match> matchesNewest
    ) {
        Set<Match> unique = new LinkedHashSet<>();

        unique.addAll(matchesNewest);
        unique.addAll(matchesOldest);

        return new ArrayList<>(unique);
    }
}
