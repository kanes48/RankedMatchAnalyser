package mc.api;

import java.util.ArrayList;
import java.util.List;

public class Match {

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Match match)) return false;

        return id == match.id;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(id);
    }

    public int id;

    /**
     * Epoch timestamp in seconds.
     */
    public long timestamp;

    /**
     * Human-readable timestamp using the machine's local timezone.
     */
    public String date;

    public boolean forfeited;
    public boolean decayed;

    public int playerCount;
    public List<String> players = new ArrayList<>();

    public String seedId;

    /**
     * Overworld structure type.
     */
    public String overworld;

    /**
     * Bastion type.
     *
     * This corresponds to the API's "nether" field.
     */
    public String bastion;

    /**
     * End tower heights.
     */
    public List<Integer> endTowers = new ArrayList<>();

    /**
     * Seed variations.
     */
    public List<String> variations = new ArrayList<>();
}