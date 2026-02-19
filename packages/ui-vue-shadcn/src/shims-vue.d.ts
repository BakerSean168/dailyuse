declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Workaround: vue-echarts internal types that leak through DTS generation
declare interface EChartsElement extends HTMLElement {
  __dispose: (() => void) | null;
}
declare const SlotSymbol: unique symbol;

declare module 'markdown-it' {
  interface Token {
    type: string;
    tag: string;
    nesting: number;
    content: string;
    children: Token[] | null;
    markup: string;
    map: [number, number] | null;
    info: string;
    meta: any;
    block: boolean;
    hidden: boolean;
    attrIndex(name: string): number;
    attrPush(attrData: [string, string]): void;
    attrSet(name: string, value: string): void;
    attrGet(name: string): string | null;
    attrJoin(name: string, value: string): void;
  }

  interface StateCore {
    Token: new (type: string, tag: string, nesting: number) => Token;
    tokens: Token[];
  }

  interface Rule {
    after(name: string, ruleName: string, fn: (state: StateCore) => void): void;
  }

  interface Ruler {
    after(name: string, ruleName: string, fn: (state: StateCore) => void): void;
  }

  interface Core {
    ruler: Ruler;
  }

  interface Options {
    html?: boolean;
    xhtmlOut?: boolean;
    breaks?: boolean;
    langPrefix?: string;
    linkify?: boolean;
    typographer?: boolean;
    quotes?: string;
    highlight?: (str: string, lang: string) => string;
  }

  class MarkdownIt {
    constructor(options?: Options);
    render(src: string): string;
    core: Core;
  }

  export default MarkdownIt;
}
