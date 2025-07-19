// CC0
// @ts-check
import * as td from "typedoc";
const { UnknownType, Application, Converter, makeRecursiveVisitor } = td;

// Plugin which, given a file like this:
//
// ```ts
// /**
//  * {@displayType ReturnType}
//  * @param x {@displayType 123}
//  * @param y {@displayType `{ copied directly }`}
//  * @typeParam T {@removeType }
//  */
// export function foo<T extends { a: 1; b: { c: 2 } }>(x: T, y: T): string { return "" }
// ```
//
// Will display documentation as if it was:
// ```ts
// export function foo<T>(x: 123, y: { copied directly }): ReturnType;
// ```

// Adapted from: https://github.com/TypeStrong/typedoc/issues/2273
/** @param {td.Application} app */
export const load = function (app) {
  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    const tags = [...app.options.getValue("inlineTags")];
    if (!tags.includes("@displayType")) {
      tags.push("@displayType");
    }
    if (!tags.includes("@removeType")) {
      tags.push("@removeType");
    }
    if (!tags.includes("@removeTypeParameterCompletely")) {
      tags.push("@removeTypeParameterCompletely");
    }
    app.options.setValue("inlineTags", tags);
  });

  app.converter.on(Converter.EVENT_RESOLVE, (context, reflection) => {
    // console.log('RESOLVE', reflection.name, reflection.id, reflection.comment, reflection.tags);
    if (!reflection.comment) return;

    const index = reflection.comment.summary.findIndex(
      (part) =>
        part.kind === "inline-tag" &&
        [
          "@displayType",
          "@removeType",
          "@removeTypeParameterCompletely",
        ].includes(part.tag)
    );

    if (index === -1) return;

    const removed = reflection.comment.summary.splice(index, 1);
    /** @type td.InlineTagDisplayPart */
    const part = removed[0];

    // Clean up the existing type so that the project can be serialized/deserialized without warnings
    reflection.type?.visit(
      makeRecursiveVisitor({
        reflection(r) {
          context.project.removeReflection(r.declaration);
        },
      })
    );

    // @removeType removes the type/default of the type parameter/generic
    if (part.tag === "@removeType") {
      // reflection.type is given by "extends", reflection.default is given by "="
      delete reflection.type;
      if ("default" in reflection) delete reflection.default;
    }
    // @removeTypeParameterCompletely removes the type parameter completely
    else if (part.tag === "@removeTypeParameterCompletely") {
      context.project.removeReflection(reflection);
    } else {
      // console.log('unknowntype', reflection.name, part.tag);
      // @displayType
      reflection.type = new UnknownType(part.text.replace(/^`*|`*$/g, ""));
    }
  });
};
