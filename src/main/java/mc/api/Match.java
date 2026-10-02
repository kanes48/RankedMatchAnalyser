package mc.api;

import java.util.ArrayList;
import java.util.List;

public class Match {

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