//! Erreur de frontière : un code littéral, repris par `packages/milestones-3d/src/error.ts`.
//! Les codes de la scène viennent de `SceneError::code` ; ceux de WebGL sont ici.
use pp_milestones::SceneError;
use wasm_bindgen::JsValue;

/// Refus de la plateforme (pas de la scène).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GlFault {
    /// Pas de contexte WebGL2 pour ce canvas.
    Unavailable,
    /// Un shader ne compile pas.
    Shader,
    /// Le programme ne se lie pas.
    Link,
    /// Une ressource (tampon, VAO, uniforme) n'a pas pu être créée.
    Resource,
}

impl GlFault {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Unavailable => "gl-unavailable",
            Self::Shader => "shader-compile",
            Self::Link => "program-link",
            Self::Resource => "gl-resource",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fault {
    Scene(SceneError),
    Gl(GlFault),
}

impl From<SceneError> for Fault {
    fn from(error: SceneError) -> Self {
        Self::Scene(error)
    }
}

impl From<GlFault> for Fault {
    fn from(error: GlFault) -> Self {
        Self::Gl(error)
    }
}

impl Fault {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::Scene(error) => error.code(),
            Self::Gl(error) => error.code(),
        }
    }
}

/// Valeur levée vers JavaScript : le code, jamais un message formaté.
#[must_use]
pub fn raise(fault: Fault) -> JsValue {
    JsValue::from_str(fault.code())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codes_are_literal() {
        assert_eq!(Fault::from(GlFault::Shader).code(), "shader-compile");
        assert_eq!(
            Fault::from(SceneError::MilestoneCount).code(),
            "milestone-count"
        );
        assert_eq!(GlFault::Unavailable.code(), "gl-unavailable");
        assert_eq!(GlFault::Link.code(), "program-link");
        assert_eq!(GlFault::Resource.code(), "gl-resource");
    }
}
