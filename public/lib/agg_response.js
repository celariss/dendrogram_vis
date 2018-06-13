module.exports = function dendrogramProvider(Private, Notifier) {

  return function (vis, resp) {

    //console.log(vis, resp);
    let buckets = resp.tables[0].rows;

    let errors = [];

    let data = {
      errors: errors,
      elements: []
    };

    buckets.map(function (d) {
      data.elements.push({
        id: d[0],
        value: d[1],
        name: d[0].substring(d[0].lastIndexOf('.') + 1),
        checked: false
      });
    });

    return data;
  };
};
