// Compute convex hull using Andrew's monotone chain algorithm
export const computeConvexHull = (points: { x: number, y: number }[]) => {
    if (points.length <= 3) return points;

    // Sort points by x-coord (and by y-coord if tied)
    points.sort((a, b) => {
        if (a.x === b.x) return a.y - b.y;
        return a.x - b.x;
    });

    // Build lower hull
    const lower = [];
    for (let i = 0; i < points.length; i++) {
        while (
            lower.length >= 2 &&
            crossProduct(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0
        ) {
            lower.pop();
        }
        lower.push(points[i]);
    }

    // Build upper hull
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        while (
            upper.length >= 2 &&
            crossProduct(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0
        ) {
            upper.pop();
        }
        upper.push(points[i]);
    }

    // Remove duplicate endpoints
    upper.pop();
    lower.pop();

    return lower.concat(upper);
};

// Cross product for convex hull calculation
export const crossProduct = (o: { x: number, y: number }, a: { x: number, y: number }, b: { x: number, y: number }) => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}; 