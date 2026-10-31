//! LTTB (Steinarsson, 2013, thèse, université d'Islande) sur une suite sans trou. Mêmes opérations
//! flottantes, dans le même ordre, que `lttb-run.ts` : la parité tient à l'indice près.
use crate::numbers::{PAIR, floor_index, to_f64};

#[derive(Debug, Clone, Copy)]
pub(crate) struct Point {
    pub x: f64,
    pub y: f64,
}

/// Aire (doublée) du triangle a, b, c.
fn area(a: Point, b: Point, c: Point) -> f64 {
    ((a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y)).abs()
}

fn average(points: &[Point]) -> Option<Point> {
    if points.is_empty() {
        return None;
    }
    let count = to_f64(points.len());
    Some(Point {
        x: points.iter().fold(0.0, |sum, p| sum + p.x) / count,
        y: points.iter().fold(0.0, |sum, p| sum + p.y) / count,
    })
}

/// Indice du point de `points[from..to]` dont le triangle avec `previous` et `next` est le plus
/// grand ; `from` et `previous` si le seau est vide.
fn pick(points: &[Point], bounds: (usize, usize), triangle: (Point, Point)) -> (usize, Point) {
    let ((from, to), (previous, next)) = (bounds, triangle);
    let bucket = points.get(from..to.min(points.len())).unwrap_or_default();
    let mut best = (from, previous, -1.0);
    for (offset, point) in bucket.iter().enumerate() {
        let current = area(previous, *point, next);
        if current > best.2 {
            best = (from + offset, *point, current);
        }
    }
    (best.0, best.1)
}

/// Bornes `[from ; to[` du seau, et fin (exclue) de la fenêtre du seau suivant.
fn bucket_bounds(bucket: usize, every: f64, count: usize) -> (usize, usize, usize) {
    let edge = |index: usize| floor_index(to_f64(index) * every) + 1;
    (
        edge(bucket),
        edge(bucket + 1),
        edge(bucket + PAIR).min(count),
    )
}

/// Indices retenus, premier et dernier compris. `quota` ≥ 2 ; au-delà de la longueur, tous les
/// points sont gardés.
pub(crate) fn lttb_run(points: &[Point], quota: usize) -> Vec<usize> {
    let count = points.len();
    let (Some(first), Some(last)) = (points.first(), points.last()) else {
        return Vec::new();
    };
    if quota >= count || count <= PAIR {
        return (0..count).collect();
    }
    let buckets = quota.saturating_sub(PAIR);
    let every = to_f64(count - PAIR) / to_f64(buckets);
    let mut kept = vec![0];
    let mut previous = *first;
    for bucket in 0..buckets {
        let (from, to, after) = bucket_bounds(bucket, every, count);
        let next = if bucket + 1 == buckets {
            *last
        } else {
            points.get(to..after).and_then(average).unwrap_or(*last)
        };
        let (index, point) = pick(points, (from, to), (previous, next));
        kept.push(index);
        previous = point;
    }
    kept.push(count - 1);
    kept
}
