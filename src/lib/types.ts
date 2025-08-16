import type { ComponentType } from 'svelte';

export interface ILink {
    id: string;
    title: string;
    url: string;
    isDndShadowItem?: boolean;
    icon: ComponentType | null;
    clicks: number;
    active: boolean;
    type: 'link'; // Type discriminator
}

export interface ICollection {
    id: string;
    title: string;
    isDndShadowItem?: boolean;
    active: boolean;
    links: ILink[]; // Use the defined ILink
    type: 'collection'; // Type discriminator
}

// Union type for items in the main list
export type BoardItem = ILink | ICollection ;

// Types for the simplified embedded structure
export interface IStandaloneLink {
    id: string;
    title: string;
    url: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
    clickCount: number;
    sortOrder: number;
    itemType: 'link';
    type: 'link'; // For UI compatibility
    // UI compatibility fields
    clicks: number; // Maps to clickCount
    active: boolean; // Maps to isActive
}

export interface ILinkGroup {
    id: string;
    title: string;
    sortOrder: number;
    links: IStandaloneLink[]; // Links within this group
    itemType: 'linkGroup';
    type: 'collection'; // For UI compatibility
    // UI compatibility fields
    active: boolean; // Always true for groups
}

// Classic mode simplified types - only standalone links
export type ClassicBoardItem = ILink; // Only standalone links allowed

// Union type for the new structure (keeping for API compatibility)
export type ClassicItem = IStandaloneLink | ILinkGroup; 