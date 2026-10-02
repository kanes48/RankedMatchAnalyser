package mc.api;

import java.util.List;

public class Main {

    public static void main(String[] args) throws Exception {

        String playerName = "SubToKanes";
        String url = "https://api.mcsrranked.com";

        List<Match> matches =
                APIClient.getLast100RankedMatches(playerName, url);

        for (Match match : matches) {
            // printBasicInfo(match);
        }
    }

    private static void printBasicInfo(Match match){
        System.out.println("----------------------------------------");
        System.out.println("Match ID:   " + match.id);
        System.out.println("Date:       " + match.date);
        System.out.println("Timestamp:  " + match.timestamp);
        System.out.println("Players:    " + match.playerCount);
        System.out.println("Player names: " + match.players);

        System.out.println("Overworld:  " + match.overworld);
        System.out.println("Bastion:    " + match.bastion);

        System.out.println("End towers: " + match.endTowers);
        System.out.println("Variations: " + match.variations);

        System.out.println("Forfeited:  " + match.forfeited);
        System.out.println("Decayed:    " + match.decayed);
    }
}