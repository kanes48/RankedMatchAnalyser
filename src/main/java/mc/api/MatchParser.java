package mc.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class MatchParser {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                    .withZone(ZoneId.systemDefault());

    public static Match parseMatch(JsonObject json) {
        Match match = new Match();

        match.id = getInt(json, "id");
        match.forfeited = getBoolean(json, "forfeited");
        match.decayed = getBoolean(json, "decayed");

        /*
         * "date" is an epoch timestamp in SECONDS
         * according to the API documentation.
         */
        if (json.has("date") && !json.get("date").isJsonNull()) {
            match.timestamp = json.get("date").getAsLong();

            match.date = DATE_FORMATTER.format(
                    Instant.ofEpochSecond(match.timestamp)
            );
        }

        /*
         * players[]
         */
        if (json.has("players") && json.get("players").isJsonArray()) {
            JsonArray players = json.getAsJsonArray("players");

            match.playerCount = players.size();

            for (JsonElement playerElement : players) {
                if (!playerElement.isJsonObject()) {
                    continue;
                }

                JsonObject player = playerElement.getAsJsonObject();

                String nickname = getString(player, "nickname");

                if (nickname != null) {
                    match.players.add(nickname);
                }
            }
        }

        /*
         * seed
         *
         * seed is null for an unfiltered seed.
         *
         * MatchSeed contains:
         *   id
         *   overworld
         *   nether
         *   endTowers
         *   variations
         */
        if (json.has("seed")
                && !json.get("seed").isJsonNull()
                && json.get("seed").isJsonObject()) {

            JsonObject seed = json.getAsJsonObject("seed");

            match.seedId = getString(seed, "id");
            match.overworld = getString(seed, "overworld");

            // API field is "nether", but our Java field is "bastion".
            match.bastion = getString(seed, "nether");

            /*
             * endTowers[]
             */
            if (seed.has("endTowers")
                    && seed.get("endTowers").isJsonArray()) {

                JsonArray towers = seed.getAsJsonArray("endTowers");

                for (JsonElement tower : towers) {
                    if (!tower.isJsonNull()) {
                        match.endTowers.add(tower.getAsInt());
                    }
                }
            }

            /*
             * variations[]
             */
            if (seed.has("variations")
                    && seed.get("variations").isJsonArray()) {

                JsonArray variations =
                        seed.getAsJsonArray("variations");

                for (JsonElement variation : variations) {
                    if (!variation.isJsonNull()) {
                        match.variations.add(
                                variation.getAsString()
                        );
                    }
                }
            }
        }

        return match;
    }

    private static String getString(JsonObject object, String name) {
        if (!object.has(name) || object.get(name).isJsonNull()) {
            return null;
        }

        return object.get(name).getAsString();
    }

    private static int getInt(JsonObject object, String name) {
        if (!object.has(name) || object.get(name).isJsonNull()) {
            return 0;
        }

        return object.get(name).getAsInt();
    }

    private static boolean getBoolean(JsonObject object, String name) {
        return object.has(name)
                && !object.get(name).isJsonNull()
                && object.get(name).getAsBoolean();
    }
}