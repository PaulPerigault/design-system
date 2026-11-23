//! État complet d'une scène : données, thème, interaction, caméra et horloge injectée.
use crate::animation::Tween;
use crate::data::MilestonesData;
use crate::error::SceneError;
use crate::geometry::pack::Pack;
use crate::interaction::Interaction;
use crate::theme::Theme;

#[derive(Debug)]
pub struct SceneState {
    pub(crate) data: MilestonesData,
    pub(crate) theme: Theme,
    pub(crate) pack: Pack,
    pub(crate) interaction: Interaction,
    /// Abscisse de la caméra, lissée vers la cible demandée par `set_progress`.
    pub(crate) camera: Tween,
    /// Cible reçue entre deux images : appliquée à la prochaine, avec l'horloge de l'appelant.
    pub(crate) pending: Option<f32>,
    /// Abscisse de la dernière image dessinée : ce que `pick` et `project` voient à l'écran.
    pub(crate) shown: f32,
    pub(crate) aspect: f32,
    pub(crate) last: Option<f32>,
}

impl SceneState {
    /// # Errors
    /// `ActiveIndex` si `active` sort du tableau, `GeometrySize` si le maillage déborde.
    pub fn new(
        data: MilestonesData,
        theme: Theme,
        active: Option<usize>,
    ) -> Result<Self, SceneError> {
        let interaction = Interaction::new(data.stops(), active)?;
        let pack = Pack::build(data.len(), data.has_goal())?;
        Ok(Self {
            data,
            theme,
            pack,
            interaction,
            camera: Tween::at(0.0),
            pending: None,
            shown: 0.0,
            aspect: 1.0,
            last: None,
        })
    }

    #[must_use]
    pub const fn pack(&self) -> &Pack {
        &self.pack
    }

    #[must_use]
    pub const fn theme(&self) -> &Theme {
        &self.theme
    }

    #[must_use]
    pub const fn data(&self) -> &MilestonesData {
        &self.data
    }

    /// Abscisse de la caméra dans la dernière image dessinée.
    #[must_use]
    pub const fn abscissa(&self) -> f32 {
        self.shown
    }

    pub const fn set_theme(&mut self, theme: Theme) {
        self.theme = theme;
    }

    /// # Errors
    /// `Viewport` si une dimension n'est pas un nombre strictement positif.
    pub fn resize(&mut self, width: f32, height: f32) -> Result<(), SceneError> {
        if !(width.is_finite() && height.is_finite() && width > 0.0 && height > 0.0) {
            return Err(SceneError::Viewport);
        }
        self.aspect = width / height;
        Ok(())
    }
}
