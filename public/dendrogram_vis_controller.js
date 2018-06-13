import * as d3 from 'd3';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';

import {
  uiModules
} from 'ui/modules';
const module = uiModules.get('kibana/dendrogram_vis', ['kibana']);

//import numeral from 'numeral';

module.controller('KbnDendrogramVisController',
  function ($scope, $element, $rootScope, Private) {
    let chartData = null;
    let index = null;

    if ($scope && $scope.$parent && $scope.$parent.vis) {
      index = $scope.$parent.vis.indexPattern.id;
    }

    $scope.visErrors = [];
    const _render = function (data) {
      //const params = $scope.vis.params;

      // Set the dimensions and margins of the diagram
      const margin = {
        top: 20,
        right: 90,
        bottom: 30,
        left: 90
      };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // We must clear the svg element to avoid duplicate rendering
      d3.select($element[0]).selectAll('svg').remove();

      const svg = d3.select($element[0]).append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      let i = 0;
      const duration = 750;

      // declares a tree layout and assigns the size
      let treemap = d3.tree().size([height, width]);

      let stratify = d3.stratify()
        .parentId(function (d) {
          return d.id.substring(0, d.id.lastIndexOf('.'));
        });

      let root = stratify(data.elements)
        .sort(function (a, b) {
          return (a.height - b.height) || a.id.localeCompare(b.id);
        });

      root.x0 = height / 2;
      root.y0 = 0;

      // Collapse after the second level
      root.children.forEach(collapse);

      update(root);

      // Collapse the node and all it's children
      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      function update(source) {        
        // Assigns the x and y position for the nodes
        let treeData = treemap(root);

        // Compute the new tree layout.
        let nodes = treeData.descendants();
        let links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
          d.y = d.depth * 180;
        });

        // ****************** Nodes section ***************************

        // Update the nodes...
        let node = svg.selectAll('g.node')
          .data(nodes, function (d) {
            return d.id || (d.id = ++i);
          });

        // Enter any new modes at the parent's previous position.
        let nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          .on('click', function (d) {
            if (d3.event.ctrlKey) {
              //dblClick(d); // TODO : Activate to enable filtering
            } else {
              click(d);
            }
          });

        // Add Circle for the nodes
        nodeEnter.append('circle')
          .attr('class', 'node')
          .attr('r', 1e-6)
          .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
          });

        // Add labels for the nodes
        nodeEnter.append('text')
          .attr("dy", "-.1em")
          .attr("x", function (d) {
            return d.children || d._children ? -13 : 13;
          })
          .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function (d) {
            return d.data.name;
          });

        // UPDATE
        let nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
          .duration(duration)
          .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
          });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
          .attr('r', 10)
          .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
          })
          .style("stroke", function (d) {
            return d.data.checked ? 'red' : '#ccc';
          })
          .attr('cursor', 'pointer');


        // Remove any exiting nodes
        let nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
          .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
          .style('fill-opacity', 1e-6);

        // ****************** links section ***************************

        // Update the links...
        let link = svg.selectAll('path.link')
          .data(links, function (d) {
            return d.id;
          });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert('path', "g")
          .attr("class", "link")
          .attr('d', function (d) {
            var o = {
              x: source.x0,
              y: source.y0
            };
            return diagonal(o, o);
          });

        // UPDATE
        let linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
          .duration(duration)
          .attr('d', function (d) {
            return diagonal(d, d.parent);
          });

        // Remove any exiting links
        let linkExit = link.exit().transition()
          .duration(duration)
          .attr('d', function (d) {
            var o = {
              x: source.x,
              y: source.y
            };
            return diagonal(o, o);
          })
          .remove();

        // Store the old positions for transition.
        nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {

          let path = `M ${s.y - 8} ${s.x}
                    C ${(s.y - 8 + d.y + 8) / 2} ${s.x},
                      ${(s.y - 8 + d.y + 8) / 2} ${d.x},
                      ${d.y + 8} ${d.x}`;

          return path;
        }

        // Toggle children on click.
        function click(d) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        }

        function dblClick(d) {

          var nodeId = d.id;

          if (nodeId !== '') {
            if (!d.data.checked) {
              d.data.checked = true;
              $scope.filter(nodeId, 'add');
            } else {
              d.data.checked = false;
              $scope.filter(nodeId, 'remove');
            }
          }

          update(d);
        }
      }
    };

    $scope.$watch('esResponse', function (resp) {
      $scope.visErrors = [];

      let aggResponse = Private(require('./lib/agg_response.js'));

      if (resp) {
        chartData = aggResponse($scope.vis, resp);

        if (chartData.elements && chartData.elements.length > 0) {

          if (chartData.errors != null) {
            if (chartData.errors.length > 0) {
              chartData.errors.map(function (d) {
                $scope.visErrors.push(d);
              });
              return;
            }
          }

          _render(chartData);

          const queryFilter = Private(FilterBarQueryFilterProvider);
          let filters = queryFilter.getAppFilters();
          _.each(filters, function (d) {
            d.meta.disabled = d.meta.originalState;
          });
        }
      }
    });
  });
