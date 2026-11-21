//! Éléments de dessin d'une médaille (support, badge, fantôme, anneau) et de l'objectif.
use crate::geometry::pack::Part;
use crate::kinds::Status;
use crate::layout::{medal_basis, ordinal, path_point};
use crate::plan::{DrawItem, Inputs, Pose};
use crate::theme::Slot;
use glam::{Mat4, Quat};

fn model(index: usize, pose: &Pose) -> Mat4 {
    let s = ordinal(index);
    let lean = if index == pose.tilted {
        Quat::from_rotation_y(pose.tilt.x) * Quat::from_rotation_x(-pose.tilt.y)
    } else {
        Quat::IDENTITY
    };
    let place = Mat4::from_translation(path_point(s)) * Mat4::from_mat3(medal_basis(s));
    place * Mat4::from_quat(lean)
}

fn ring_slot(inputs: &Inputs<'_>, index: usize, pose: &Pose) -> Option<Slot> {
    let marked = pose.hover == Some(index) || pose.active == Some(index);
    let bare = inputs
        .data
        .milestones()
        .get(index)
        .is_some_and(|m| m.status == Status::Achieved && !m.has_badge);
    if marked {
        Some(Slot::Accent)
    } else {
        bare.then_some(Slot::Line)
    }
}

pub(crate) fn medal(inputs: &Inputs<'_>, index: usize, pose: &Pose, items: &mut Vec<DrawItem>) {
    let Some(milestone) = inputs.data.milestones().get(index) else {
        return;
    };
    let at = model(index, pose);
    if milestone.status == Status::Planned {
        items.extend(inputs.faded(Part::Wire, at, Slot::Muted));
    } else {
        items.extend(inputs.lit(Part::Support, at, Slot::Paper));
        let badge = inputs.item(Part::Badge, at, Slot::Paper);
        items.extend(badge.filter(|_| milestone.has_badge).map(|i| DrawItem {
            texture: Some(index),
            ..i
        }));
    }
    items.extend(ring_slot(inputs, index, pose).and_then(|slot| inputs.item(Part::Ring, at, slot)));
}

pub(crate) fn goal(inputs: &Inputs<'_>, pose: &Pose, items: &mut Vec<DrawItem>) {
    let index = inputs.data.len();
    let at = model(index, pose);
    items.extend(inputs.lit(Part::Star, at, Slot::Accent));
    items.extend(inputs.item(Part::StarOutline, at, Slot::Fg));
    let marked = pose.hover == Some(index) || pose.active == Some(index);
    items.extend(
        marked
            .then(|| inputs.item(Part::Ring, at, Slot::Accent))
            .flatten(),
    );
}
