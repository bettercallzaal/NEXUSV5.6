export interface Link {
  id?: string;
  title: string;
  url: string;
  description: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  name: string;
  links: Link[];
}

export interface Category {
  name: string;
  subcategories: Subcategory[];
}

export interface Data {
  categories: Category[];
  links: Link[];
}

// Alias for backward compatibility
export type LinksData = Data;
