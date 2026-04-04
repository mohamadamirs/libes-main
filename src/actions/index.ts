// src/actions/index.ts
import { authActions } from "./auth";
import { postActions } from "./posts";
import { agendaActions } from "./agenda";

export const server = {
  ...authActions,
  ...postActions,
  ...agendaActions,
};
