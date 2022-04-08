import { ESLintUtils, TSESTree } from "@typescript-eslint/experimental-utils";
import {
  isFunctionExpression,
  isMemberExpression,
  isCallExpression,
  isIdentifier,
  isAssignmentExpression,
} from "eslint-etc";
import {
  isMethodDeclaration,
  isObjectLiteralExpression,
  Node,
} from "typescript";

const debug: typeof console.log = (...args: Parameters<typeof console.log>) =>
  process.env.DEBUG && console.log(...args);

export const requireVueSet = ESLintUtils.RuleCreator(
  () => "https://github.com/Maxim-Mazurok/eslint-plugin-vue-2-object-reactivity"
)({
  name: "require-vue-set",
  meta: {
    type: "problem",
    docs: {
      description: "Require `Vue.set()` for object changes",
      category: "Possible Errors",
      recommended: "error",
    },
    messages: {
      useVueSet: "Use `Vue.set()` for changing objects in state",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    const { esTreeNodeToTSNodeMap, tsNodeToESTreeNodeMap } =
      ESLintUtils.getParserServices(context);

    const checkTsNode = (
      tsNode: Node,
      node: TSESTree.Property | TSESTree.VariableDeclarator
    ) => {
      if (isObjectLiteralExpression(tsNode)) {
        const mutations = tsNode.properties;
        mutations.map((mutation) => {
          if (isMethodDeclaration(mutation)) {
            debug(`Mutation name: ${mutation.name.getText()}`);
            if (mutation.parameters.length >= 1) {
              const stateParameter = mutation.parameters[0];
              const stateParameterName = stateParameter.name.getText();
              debug(`State parameter name: ${stateParameterName}`);

              const mutationCodeBlock = mutation.body;
              if (mutationCodeBlock !== undefined) {
                const scope = context.getScope();
                const mutationCodeBlockESTree =
                  tsNodeToESTreeNodeMap.get(mutationCodeBlock);

                const mutationCodeBlockScope = scope.childScopes.find(
                  (x) =>
                    isFunctionExpression(x.block) &&
                    x.block.body === mutationCodeBlockESTree
                );

                if (mutationCodeBlockScope !== undefined) {
                  const stateVariable = mutationCodeBlockScope.variables.find(
                    (x) => x.name === stateParameterName
                  );
                  if (stateVariable !== undefined) {
                    const stateReferences =
                      mutationCodeBlockScope.references.filter(
                        (x) => x.resolved === stateVariable
                      );

                    stateReferences.forEach((stateReference) => {
                      const stateReferenceParent =
                        stateReference.identifier.parent;
                      if (
                        stateReferenceParent !== undefined &&
                        isMemberExpression(stateReferenceParent)
                      ) {
                        // check if we find Vue.set(state)
                        const vueSetCallExpression =
                          stateReferenceParent.parent;
                        if (
                          vueSetCallExpression !== undefined &&
                          isCallExpression(vueSetCallExpression) &&
                          isMemberExpression(vueSetCallExpression.callee) &&
                          isIdentifier(vueSetCallExpression.callee.object) &&
                          isIdentifier(vueSetCallExpression.callee.property)
                        ) {
                          vueSetCallExpression.callee.object.name === "Vue" &&
                            vueSetCallExpression.callee.property.name === "set";
                          debug("Yay, Vue.set(state) found!");
                          return;
                        } else {
                          debug("Vue.set not found...");
                        }

                        // check if we see something being assigned to state.object.something
                        let assignmentExpression: TSESTree.Node =
                          stateReferenceParent;
                        let memberExpressionsSaw = 0;
                        do {
                          if (assignmentExpression.parent === undefined) {
                            break;
                          }
                          if (isMemberExpression(assignmentExpression))
                            memberExpressionsSaw++;
                          assignmentExpression = assignmentExpression.parent;
                          debug({ assignmentExpression });
                        } while (
                          assignmentExpression !== null &&
                          isMemberExpression(assignmentExpression) &&
                          !isAssignmentExpression(assignmentExpression)
                        );

                        if (memberExpressionsSaw <= 1) {
                          debug(
                            "assignment to prop, nor prop of prop, which is fine"
                          );
                          return;
                        }

                        debug("Oh-oh, state.object.something = ... found!");
                        context.report({
                          node,
                          loc: {
                            start: stateReferenceParent.loc.start,
                            end: assignmentExpression.loc.end,
                          },
                          messageId: "useVueSet",
                        });
                      }
                    });
                  }
                }
              }
            }
          }
        });
      }
    };

    function checkMutationsInProperty(node: TSESTree.Property) {
      const tsNode = esTreeNodeToTSNodeMap.get(node.value);
      checkTsNode(tsNode, node);
    }

    function checkMutationsInVariable(node: TSESTree.VariableDeclarator) {
      const tsNode = esTreeNodeToTSNodeMap.get(node.init);
      checkTsNode(tsNode, node);
    }

    return {
      // http://estools.github.io/esquery/   https://github.com/estools/esquery
      'Property[key.name="mutations"][value.type="ObjectExpression"][value.properties.length!=0]':
        checkMutationsInProperty,
      "VariableDeclaration > [id.name=mutations]": checkMutationsInVariable,
      // TODO: maybe narrow the search by looking for mutations declaration inside of Vuex.Store?
    };
  },
});
