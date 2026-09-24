/**
 * Type d'équipement. Les valeurs connues ont une icône, un libellé et un
 * forfait dans constants.ts ; tout autre type (issu du catalogue) est accepté
 * et rendu de façon générique.
 */
export type NodeType = string;

export interface EquipmentItem {
  id: string;
  /** Libellé court affiché dans la sidebar et sur le nœud. */
  name: string;
  /** Titre complet de la fiche, pour l'info-bulle et la recherche. */
  fullName?: string;
  type: NodeType;
  /** Identifiant du produit en base, quand l'équipement vient du catalogue. */
  productId?: number;
}

export interface EquipmentCategory {
  name: string;
  expanded: boolean;
  items: EquipmentItem[];
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  /** Lien vers la fiche catalogue d'origine ; absent pour un nœud générique. */
  productId?: number;
  /** Prix relevé par l'utilisateur, en euros HT (devis, site constructeur…). */
  price?: number;
  /** Source et date du relevé, en texte libre : « devis Bechtle 18/09 ». */
  priceNote?: string;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  waypoints?: Waypoint[];
}
