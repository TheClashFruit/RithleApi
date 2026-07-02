import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Image } from "mdast";

interface Options {
  variables: Record<string, any>;
}

const fillTemplate = (value: string, variables: Record<string, any>) =>
  value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
    (key in variables ? variables[key] : match).toString(),
  );

const remarkFillVariables: Plugin<[Options], Root> = ({ variables }) => {
  return (tree) => {
    visit(tree, "text", (node: Text) => {
      node.value = fillTemplate(node.value, variables);
    });

    visit(tree, "link", (node: Link) => {
      node.url = fillTemplate(node.url, variables);
      if (node.title) {
        node.title = fillTemplate(node.title, variables);
      }
    });

    visit(tree, "image", (node: Image) => {
      node.url = fillTemplate(node.url, variables);
      if (node.alt) {
        node.alt = fillTemplate(node.alt, variables);
      }
    });
  };
};

export default remarkFillVariables;
