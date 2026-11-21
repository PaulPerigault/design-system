//! Spline de Catmull-Rom uniforme (Catmull et Rom, 1974) : un segment entre `p1` et `p2`.
//!
//! Uniforme plutôt que centripète : les points de contrôle de la scène sont à pas constant
//! (une unité d'abscisse, même écart en profondeur), cas où les deux paramétrages donnent des
//! courbes indiscernables et où le centripète n'évite aucune boucle ni pointe. La forme uniforme
//! est un polynôme de degré 3 sans racine ni exponentielle : moins de code dans le `.wasm`.
use glam::Vec3;

const HALF: f32 = 0.5;
/// Coefficients de la matrice de base de Catmull-Rom (tension 0,5), en facteur de `HALF`.
const C2: [f32; 4] = [2.0, -5.0, 4.0, -1.0];
const C3: [f32; 4] = [-1.0, 3.0, -3.0, 1.0];
/// Dérivées : le terme du second degré est doublé, celui du troisième triplé.
const DOUBLE: f32 = 2.0;
const TRIPLE: f32 = 3.0;

fn combine(weights: [f32; 4], points: [Vec3; 4]) -> Vec3 {
    weights
        .into_iter()
        .zip(points)
        .map(|(weight, point)| point * weight)
        .sum()
}

/// Point et dérivée (par rapport à `t`) du segment `p[1]` à `p[2]`, pour `t` dans [0, 1].
#[must_use]
pub fn catmull_rom(p: [Vec3; 4], t: f32) -> (Vec3, Vec3) {
    let [p0, p1, p2, _] = p;
    let (second, third) = (combine(C2, p), combine(C3, p));
    let point = (p1 * DOUBLE + (p2 - p0) * t + second * (t * t) + third * (t * t * t)) * HALF;
    let slope = ((p2 - p0) + second * (DOUBLE * t) + third * (TRIPLE * t * t)) * HALF;
    (point, slope)
}
