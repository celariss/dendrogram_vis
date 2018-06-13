curl -XDELETE http://localhost:9200/dendrogram_data -H 'Content-Type: application/json'
curl -XPUT http://localhost:9200/dendrogram_data -H 'Content-Type: application/json' -d@"mapping.json"
