//! Erreur de frontière : `code:grandeur`, la grandeur étant vide quand elle ne s'applique pas.
//! Codes littéraux, repris tels quels par `packages/color/src/error.ts`.
use pp_color::{ColorError, Component};
use wasm_bindgen::JsValue;

/// Un tableau de canaux n'a pas trois valeurs (l'enveloppe TypeScript n'en envoie jamais d'autre).
pub const INVALID_LENGTH: &str = "invalid-length:";

fn component(component: Component) -> &'static str {
    match component {
        Component::Lightness => "lightness",
        Component::Chroma => "chroma",
        Component::Hue => "hue",
        Component::Red => "red",
        Component::Green => "green",
        Component::Blue => "blue",
        Component::Epsilon => "epsilon",
    }
}

/// Texte de frontière d'une erreur de `pp-color`.
pub fn code(error: ColorError) -> String {
    match error {
        ColorError::NonFinite(c) => ["non-finite:", component(c)].concat(),
        ColorError::OutOfRange(c) => ["out-of-range:", component(c)].concat(),
        ColorError::InvalidHex => "invalid-hex:".to_owned(),
        ColorError::OutOfGamut => "out-of-gamut:".to_owned(),
    }
}

pub fn fault(error: ColorError) -> JsValue {
    JsValue::from_str(&code(error))
}

pub fn bad_length() -> JsValue {
    JsValue::from_str(INVALID_LENGTH)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_error_has_a_literal_code() {
        assert_eq!(
            code(ColorError::NonFinite(Component::Hue)),
            "non-finite:hue"
        );
        assert_eq!(
            code(ColorError::OutOfRange(Component::Epsilon)),
            "out-of-range:epsilon"
        );
        assert_eq!(code(ColorError::InvalidHex), "invalid-hex:");
        assert_eq!(code(ColorError::OutOfGamut), "out-of-gamut:");
    }

    #[test]
    fn every_component_is_named() {
        let all = [
            (Component::Lightness, "lightness"),
            (Component::Chroma, "chroma"),
            (Component::Hue, "hue"),
            (Component::Red, "red"),
            (Component::Green, "green"),
            (Component::Blue, "blue"),
            (Component::Epsilon, "epsilon"),
        ];
        for (c, name) in all {
            assert_eq!(component(c), name);
        }
    }
}
