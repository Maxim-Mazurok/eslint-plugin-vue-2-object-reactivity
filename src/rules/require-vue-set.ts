import { ESLintUtils, TSESTree } from "@typescript-eslint/experimental-utils";
import {
  isFunctionExpression,
  isMemberExpression,
  isCallExpression,
  isIdentifier,
  isAssignmentExpression,
} from "eslint-etc";
import { isMethodDeclaration, isObjectLiteralExpression } from "typescript";

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
    const { program, esTreeNodeToTSNodeMap, tsNodeToESTreeNodeMap } =
      ESLintUtils.getParserServices(context);
    const checker = program.getTypeChecker();

    function checkMutations(node: TSESTree.Property) {
      // console.log(node);
      const tsNode = esTreeNodeToTSNodeMap.get(node.value);
      if (isObjectLiteralExpression(tsNode)) {
        const mutations = tsNode.properties;
        mutations.map((mutation) => {
          if (isMethodDeclaration(mutation)) {
            console.log(`Mutation name: ${mutation.name.getText()}`);
            if (mutation.parameters.length >= 1) {
              const stateParameter = mutation.parameters[0];
              const stateParameterName = stateParameter.name.getText();
              console.log(`State parameter name: ${stateParameterName}`);

              const mutationCodeBlock = mutation.body;
              if (mutationCodeBlock !== undefined) {
                const scope = context.getScope();
                const mutationCodeBlockESTree =
                  tsNodeToESTreeNodeMap.get(mutationCodeBlock);

                const mutationCodeBlockScope = scope.childScopes.find((x) => {
                  console.log("test");
                  return (
                    isFunctionExpression(x.block) &&
                    x.block.body === mutationCodeBlockESTree
                  );
                });

                if (mutationCodeBlockScope !== undefined) {
                  const stateVariable = mutationCodeBlockScope.variables.find(
                    (x) => x.name === stateParameterName
                  );
                  if (stateVariable !== undefined) {
                    const stateReferences =
                      mutationCodeBlockScope.references.filter(
                        (x) => x.resolved === stateVariable
                      );

                    stateReferences.find((stateReference) => {
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
                          console.log("Yay, Vue.set(state) found!");
                        }

                        // check if we see something being assigned to state.object.something
                        let assignmentExpression: TSESTree.Node =
                          stateReferenceParent;
                        do {
                          if (assignmentExpression.parent === undefined) {
                            break;
                          }
                          assignmentExpression = assignmentExpression.parent;
                        } while (
                          assignmentExpression !== null &&
                          !isAssignmentExpression(assignmentExpression)
                        );

                        if (
                          assignmentExpression !== null &&
                          isAssignmentExpression(assignmentExpression) &&
                          isMemberExpression(assignmentExpression.left) &&
                          isMemberExpression(
                            assignmentExpression.left.object
                          ) &&
                          isIdentifier(
                            assignmentExpression.left.object.object
                          ) &&
                          assignmentExpression.left.object.object.name ===
                            stateParameterName
                        ) {
                          console.log(
                            "Oh-oh, state.object.something = ... found!"
                          );
                          context.report({
                            node,
                            messageId: "useVueSet",
                          });
                        }
                      }
                    });
                  }
                }
              }
            }
          }
        });
      }
    }

    return {
      'Property[key.name="mutations"][value.type="ObjectExpression"][value.properties.length!=0]':
        checkMutations,
      // TODO: maybe narrow the search by looking for mutations declaration inside of Vuex.Store?
    };
  },
});
