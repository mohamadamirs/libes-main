// src/actions/index.ts
import { authActions } from "./auth";
import { postActions } from "./posts";
import { agendaActions } from "./agenda";
import { profileActions } from "./profile";
import { categoryActions } from "./categories";

export const server = {
  ...authActions,
  ...postActions,
  ...agendaActions,
  ...profileActions,
  ...categoryActions,
};
