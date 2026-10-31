//! Sous-échantillonnage LTTB : délègue à `pp-data`.
use crate::fault::Fault;
use crate::input::optional;
use wasm_bindgen::prelude::wasm_bindgen;

/// Indices à garder. `missing` est le masque de `values` (non nul = manquant) ; `target` est la
/// cible, un entier que l'enveloppe TypeScript a déjà contrôlé.
///
/// # Errors
///
/// Les erreurs de `pp_data::lttb`, ou `bad-argument` si le masque n'a pas la longueur des valeurs.
#[wasm_bindgen]
pub fn lttb(xs: &[f64], values: &[f64], missing: &[u8], target: u32) -> Result<Vec<u32>, Fault> {
    let target = usize::try_from(target).map_err(|_| Fault::BadArgument)?;
    let kept = pp_data::lttb(xs, &optional(values, missing)?, target)?;
    kept.into_iter()
        .map(|index| u32::try_from(index).map_err(|_| Fault::BadArgument))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use pp_data::DataError;

    #[test]
    fn delegates_and_maps_the_mask() {
        let xs = [0.0, 1.0, 2.0];
        assert_eq!(
            lttb(&xs, &[1.0, 2.0, 3.0], &[0, 0, 0], 10),
            Ok(vec![0, 1, 2])
        );
        assert_eq!(
            lttb(&xs, &[1.0, 0.0, 3.0], &[0, 1, 0], 5),
            Ok(vec![0, 1, 2])
        );
        assert_eq!(
            lttb(&xs, &[1.0, 2.0, 3.0], &[0, 0, 0], 1),
            Err(DataError::BadTarget.into())
        );
        assert_eq!(
            lttb(&xs, &[1.0, 2.0, 3.0], &[0], 4),
            Err(Fault::BadArgument)
        );
    }
}
