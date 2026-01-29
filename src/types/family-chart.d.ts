declare module "family-chart" {
  export interface Datum {
    id: string;
    data: Record<string, unknown>;
    rels: {
      father?: string;
      mother?: string;
      spouses?: string[];
      children?: string[];
    };
  }

  export interface TreeDatum extends Datum {
    x?: number;
    y?: number;
  }

  export interface UpdateTreeProps {
    initial?: boolean;
    transition_time?: number;
    tree_position?: "inherit" | "fit" | "main_to_middle";
  }

  export interface CardDimensions {
    w?: number;
    h?: number;
    text_x?: number;
    text_y?: number;
    img_w?: number;
    img_h?: number;
    img_x?: number;
    img_y?: number;
  }

  export interface CardHtmlClass {
    setStyle(
      style: "default" | "rect" | "imageCircleRect" | "imageCircle" | "imageRect"
    ): CardHtmlClass;
    setCardDisplay(display: string[][]): CardHtmlClass;
    setCardInnerHtmlCreator(
      creator: (d: TreeDatum) => string
    ): CardHtmlClass;
    setOnCardClick(
      handler: (e: MouseEvent, d: TreeDatum) => void
    ): CardHtmlClass;
    setCardDim(dim: CardDimensions): CardHtmlClass;
    setMiniTree(enabled: boolean): CardHtmlClass;
    setCardImageField(field: string): CardHtmlClass;
    setDefaultPersonIcon(
      creator: (d: TreeDatum) => string
    ): CardHtmlClass;
    setOnCardUpdate(
      handler: (d: TreeDatum) => void
    ): CardHtmlClass;
    setOnHoverPathToMain(): CardHtmlClass;
    unsetOnHoverPathToMain(): CardHtmlClass;
    resetCardDim(): CardHtmlClass;
    getCard(): (d: TreeDatum) => void;
  }

  export interface CardSvgClass {
    setStyle(
      style: "default" | "rect" | "imageCircleRect" | "imageCircle" | "imageRect"
    ): CardSvgClass;
    setCardDisplay(display: string[][]): CardSvgClass;
  }

  export interface EditTree {
    setFields(fields: string[]): EditTree;
    setOnChange(handler: () => void): EditTree;
    getStoreDataCopy(): Datum[];
  }

  export interface Store {
    data: Datum[];
    main_id: string;
    tree?: unknown;
  }

  export interface Chart {
    cont: HTMLElement;
    svg: SVGElement;
    store: Store;
    transition_time: number;
    is_card_html: boolean;

    setCardXSpacing(spacing: number): Chart;
    setCardYSpacing(spacing: number): Chart;
    setAncestryDepth(depth: number): Chart;
    setTransitionTime(ms: number): Chart;
    setBeforeUpdate(fn: () => void): Chart;
    setAfterUpdate(fn: () => void): Chart;

    setCardHtml(): CardHtmlClass;
    setCardSvg(): CardSvgClass;
    setCard(
      card: (cont: HTMLElement, store: Store) => CardHtmlClass | CardSvgClass
    ): CardHtmlClass | CardSvgClass;

    updateTree(props?: UpdateTreeProps): Chart;
    editTree(): EditTree;

    getMainDatum(): Datum;
    getMaxDepth(d_id: string): { ancestry: number; progeny: number };
    calculateKinships(
      d_id: string,
      config?: { show_in_law?: boolean }
    ): unknown;
  }

  export function createChart(
    container: string | HTMLElement,
    data: Datum[]
  ): Chart;
}

declare module "family-chart/styles/family-chart.css" {
  const content: string;
  export default content;
}
