
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { CATEGORY } from 'ui/vis/vis_category';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisSchemasProvider } from 'ui/vis/editors/default/schemas';

// we need to load the css ourselves
import './dendrogram_vis.less';
// we also need to load the controller used by the template
import './dendrogram_vis_controller';

//import { TemplateVisTypeProvider } from 'ui/template_vis_type/template_vis_type';
import dendrogramVisTemplate from './dendrogram_vis.html';
import optionsTemplate from './dendrogram_vis_params.html';

VisTypesRegistryProvider.register(KbnDendrogramVisProvider);

function KbnDendrogramVisProvider(Private) {
  //const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);
  const VisFactory = Private(VisFactoryProvider);

  // return the visType object, which kibana will use to display and configure new
  // Vis object of this type.
  return VisFactory.createAngularVisualization({
    name: 'dendrogram_vis',
    title: 'Dendrogram',
    icon: 'fa-table',
    category: CATEGORY.OTHER,
    description: 'Dendrogram Visualization Plugin (D3)',
    visConfig: {
      defaults: {
        fontSize: 30,
        fontSizeLabel: 10
      },
      template: dendrogramVisTemplate,
    },
    editorConfig: {
      optionsTemplate,
      schemas: new Schemas([{
        group: 'metrics',
        name: 'metric',
        title: 'Field with Values',
        min: 1,
        defaults: [{
          type: 'count',
          schema: 'metric'
        }]
      }, {
        group: 'buckets',
        name: 'segment',
        title: 'Structure Data',
        min: 0,
        max: 1,
        aggFilter: ['terms']
      }]),
    },
    requiresSearch: true
  });
}

export default KbnDendrogramVisProvider;
