//! Erreur de frontière : une chaîne littérale, reprise telle quelle par `packages/data/src/error.ts`.
use pp_data::DataError;
use wasm_bindgen::JsValue;

/// Cause d'un refus : une erreur de `pp-data`, ou un argument que la liaison ne sait pas lire
/// (opération inconnue, cible hors d'un `u32`, masque de longueur différente).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fault {
    Data(DataError),
    BadArgument,
}

impl From<DataError> for Fault {
    fn from(error: DataError) -> Self {
        Self::Data(error)
    }
}

impl Fault {
    /// Code littéral de la frontière, un par variante de `DataError`.
    pub const fn code(self) -> &'static str {
        match self {
            Self::BadArgument => "bad-argument",
            Self::Data(DataError::EmptyInput) => "empty-input",
            Self::Data(DataError::NonFiniteValue) => "non-finite-value",
            Self::Data(DataError::BadProbability) => "bad-probability",
            Self::Data(DataError::LengthMismatch) => "length-mismatch",
            Self::Data(DataError::NonFiniteAbscissa) => "non-finite-abscissa",
            Self::Data(DataError::BadTarget) => "bad-target",
            Self::Data(DataError::BadDate) => "bad-date",
            Self::Data(DataError::TooManyPoints) => "too-many-points",
        }
    }
}

impl From<Fault> for JsValue {
    fn from(fault: Fault) -> Self {
        Self::from_str(fault.code())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_error_has_a_distinct_literal_code() {
        let all = [
            (Fault::BadArgument, "bad-argument"),
            (DataError::EmptyInput.into(), "empty-input"),
            (DataError::NonFiniteValue.into(), "non-finite-value"),
            (DataError::BadProbability.into(), "bad-probability"),
            (DataError::LengthMismatch.into(), "length-mismatch"),
            (DataError::NonFiniteAbscissa.into(), "non-finite-abscissa"),
            (DataError::BadTarget.into(), "bad-target"),
            (DataError::BadDate.into(), "bad-date"),
            (DataError::TooManyPoints.into(), "too-many-points"),
        ];
        for (fault, code) in all {
            assert_eq!(fault.code(), code);
        }
    }
}
