# training of classifiers for "pages containing / linking to datasets"

workflow:

## collect seed urls by topic
collected by hand from lists:

#### class `dataportals`: 700 seed URLs
- from dataportals.org
- one more source, dont find it anymore

#### class `unrelated`: 800 seed URLs
- used alexa top 50 for each category, scraped from website using `$x('/html/body/div[1]/div/section/div/div/section[2]/span/span/div/div/div[2]/div/div[2]/p/a').map(v => 'http://' + v.textContent.toLowerCase()).join('\n')`
- query google with ~10 queries, store first 30 results each. queries are from `unrelated` testcase in develop branch.
  after submitting the crawl testcase to the controller, get the URLs out of elasticsearch:
    ```
    curl localhost:9200/crawlstatus-*/_search?size=9999 | jq '.hits.hits[]._source.url' | tr -d '"' > ../topicmodeler/seeds/unrelated.tsv
    ```

To get a unique list of URLS, in TSV format with augmented metadata for stormcrawler run:
```sh
seed_category=dataportal
cat $seed_category.txt | sort | uniq -u | sed "s/$/\tcategory=$seed_category\tmax.depth=1/" > $seed_category.tsv
```

## put seed urls into crawler
using `crawler/run.sh`, using a separate index for each class.
crawler was running for ~30min

- `dataportals`: stay on same domain policy. ~6700 pages fetched
- `unrelated`: roam freely. ~17600 pages fetched

## create folder structure and split data into test- & trainingset
```
# find out how many results we have
ls trainingdata/dataportals | wc -l # 6730  -> 30%: 2019
ls trainingdata/unrelated | wc -l   # 17600 -> 30%: 5269

# move random 30% of pages
cd trainingdata
for f in $(ls unrelated | shuf -n 5296); do mv unrelated/$f testset/unrelated/ ; done
for f in $(ls dataportals | shuf -n 5296); do mv dataportals/$f testset/dataportals/ ; done
```

resulting structure:
```
╰─ tree trainingdata/traintest1_en -d
trainingdata/traintest1_en
├── testset
│   ├── dataportal
│   └── unrelated
└── trainingset
    ├── dataportal
    └── unrelated

6 directories
```

## curate stopwords list
- filtered placenames by scraping wikipedia lists of countries, states, cities by hand

## evaluate different model algos
```
conda install ... package list etc
source activate
python3 scikit_classifydemo.py
```
