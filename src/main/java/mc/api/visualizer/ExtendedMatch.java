package mc.api.visualizer;

import java.util.List;

public record ExtendedMatch(
        List<Split> splits,
        String bastionType,
        String overworldType,
        double time
) {
    public record Split(
            String name,
            double time
    ) {}
}
