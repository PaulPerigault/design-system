//! Éléments de dessin d'une médaille (support, coche, fantôme, anneau) et de l'objectif.
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
    let bare = inputs
        .data
        .milestones()
        .get(index)
        .is_some_and(|m| m.status == Status::Achieved && !m.has_badge);
    if pose.hover == Some(index) {
        Some(Slot::Fg)
    } else if pose.active == Some(index) {
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
        if !milestone.has_badge {
            items.extend(inputs.lit(Part::Check, at, Slot::Accent));
        }
    }
    items.extend(ring_slot(inputs, index, pose).and_then(|slot| inputs.item(Part::Ring, at, slot)));
}

pub(crate) fn goal(inputs: &Inputs<'_>, pose: &Pose, items: &mut Vec<DrawItem>) {
    let index = inputs.data.len();
    let at = model(index, pose);
    items.extend(inputs.lit(Part::Star, at, Slot::Accent));
    items.extend(inputs.item(Part::StarOutline, at, Slot::Fg));
    let slot = if pose.hover == Some(index) {
        Some(Slot::Fg)
    } else {
        (pose.active == Some(index)).then_some(Slot::Accent)
    };
    items.extend(slot.and_then(|slot| inputs.item(Part::Ring, at, slot)));
}
