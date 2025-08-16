import type { ColumnDef } from "@tanstack/table-core";

import { createRawSnippet } from "svelte";

import { renderComponent, renderSnippet } from "$lib/components/ui/data-table";
import DataTableActions from "./data-table-actions.svelte";
import DataTableSortableHeader from "./data-table-sortable-header.svelte";
import RoleStatus from "./_components/role-status.svelte";
import Dates from "./_components/dates.svelte";
import LastLogin from "./_components/last-login.svelte";
import Profile from "./_components/profile.svelte";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type UserRowProfile = {
  avatar: string;
  name: string;
  email: string;
  id: string;
  image: string;
};

export type UserRowStatus = {
  banned: boolean;
  banReason: string;
  emailVerified: boolean;
};

export type UserRow = {
  id: string;
  profile: UserRowProfile;
  role: string;
  createdAt: string;
  updatedAt: string;
  status: UserRowStatus;
  lastLogin: string | null;
};

export const columns: ColumnDef<UserRow>[] = [
  // {
  //   accessorKey: 'profile',
  //   header: 'Profile',    
  //   cell: ({ row }) => {
  //     const s = createRawSnippet<[UserRowProfile]>((getUser) => {
  //       const profile = getUser();
  //       if (!profile) {
  //         return {
  //           render: () => `<div>No profile</div>`,
  //         };
  //       }
  //       return {
  //         render: () => renderComponent(Profile, { row: row.original }),
  //       };
  //     });

  //     return renderSnippet(
  //       s,
  //       row.original.profile
  //     );
  //   },
  // },
  {
    accessorKey: 'profile',
    header: ({ column }) =>
      renderComponent(DataTableSortableHeader, {
        onclick: column.getToggleSortingHandler(),
        text: "Profile"
      }),
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(Profile, { row: row.original });
    },
  },

  {
    accessorKey: 'role',
    header: ({ column }) =>
      renderComponent(DataTableSortableHeader, {
        onclick: column.getToggleSortingHandler(),
        text: "Status & Roles"
      }),
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(RoleStatus, { row: row.original });
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) =>
      renderComponent(DataTableSortableHeader, {
        onclick: column.getToggleSortingHandler(),
        text: "Created At / Updated At"
      }),
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(Dates, { row: row.original });
    },
  },
  {
    accessorKey: "lastLogin",
    header: ({ column }) =>
      renderComponent(DataTableSortableHeader, {
        onclick: column.getToggleSortingHandler(),
        text: "Last Login"
      }),
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(LastLogin, { row: row.original });
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(DataTableActions, { row: row.original });
    },
    enableSorting: false,
  },

];
