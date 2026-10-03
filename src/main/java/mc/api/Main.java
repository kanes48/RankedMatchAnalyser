package mc.api;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class Main {

    public static void main(String[] args) throws Exception {

        String playerName = "SubToKanes";
        String url = "https://api.mcsrranked.com";

        List<Match> matchesNewest =
                APIClient.getLast100RankedMatches(playerName, url, false, 75);

        List<Match> matchesOldest =
                APIClient.getLast100RankedMatches(playerName, url, true, 75);

        List<Match> matches = removeDuplicates(matchesOldest, matchesNewest);

        System.out.println("Total number of private room matches played: " + matches.size());

        for(Match m: matches){
            //printBasicInfo(m);
        }
    }

    private static List<Match> removeDuplicates(
            List<Match> matchesOldest,
            List<Match> matchesNewest) {

        Set<Match> unique = new LinkedHashSet<>();

        unique.addAll(matchesNewest);
        unique.addAll(matchesOldest);

        return new ArrayList<>(unique);
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