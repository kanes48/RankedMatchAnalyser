package mc.api.visualizer;

import java.util.List;

public record ExtendedMatch(
        int id,
        List<Split> splits,
        double finalTime,
        String bastionType,
        String overworldType
) {
    public record Split(
            String name,
            double time
    ) {}
}
