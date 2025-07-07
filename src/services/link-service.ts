/**
 * Link Service
 * 
 * This service provides functions for managing links in the application.
 * It handles operations like fetching, adding, updating, and deleting links.
 */

import { Link } from "@/types/links";

export interface AddLinkRequest {
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory?: string;
  tags: string[];
  isNew?: boolean;
  isOfficial?: boolean;
}

export class LinkService {
  /**
   * Fetch all links from the API
   */
  public static async getLinks(dataset: string = 'default'): Promise<Link[]> {
    try {
      const response = await fetch(`/api/links?dataset=${dataset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch links: ${response.status}`);
      }

      const data = await response.json();
      return data.links || [];
    } catch (error) {
      console.error('Error fetching links:', error);
      throw error;
    }
  }

  /**
   * Add a new link
   */
  public static async addLink(linkData: AddLinkRequest): Promise<Link> {
    try {
      // Generate a unique ID for the link
      const id = this.generateId();
      
      const link: Link = {
        id,
        ...linkData,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add link: ${response.status}`);
      }

      const result = await response.json();
      return result.link;
    } catch (error) {
      console.error('Error adding link:', error);
      throw error;
    }
  }

  /**
   * Update an existing link
   */
  public static async updateLink(id: string, linkData: Partial<Link>): Promise<Link> {
    try {
      const link: Partial<Link> = {
        id,
        ...linkData,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update link: ${response.status}`);
      }

      const result = await response.json();
      return result.link;
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for a link
   */
  private static generateId(): string {
    return 'link_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
