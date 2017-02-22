// Prototype Crawler
function Crawler() {};

// Static method
Crawler.webpage = require('webpage');

// Prototype methods
Crawler.prototype.getScreenshot = function (repository, onSuccess, onFailure) {

    var page = Crawler.webpage.create();

    page.open(repository.link, function (status) {
        if ('fail' === status) { 
            onFailure({
                url: repository.link, 
                status: status,
                message: 'Wrong status visiting the url repository.'
            });
        } else {
            var filename = repository.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".png";
            page.render('screenshots/'+ filename);
            onSuccess({
                url: repository.link,
                status: status,
                message: 'Screenshot done from repository \"' + repository.title + '\" with filename : ' + filename
            });
        };
    });

};

Crawler.prototype.crawl = function (url, onSuccess, onFailure) {

    var self = this;
    var page = Crawler.webpage.create();

    page.open(url, function (status) {
        if ('fail' === status) {
            onFailure({
                url: url, 
                status: status,
                message: 'Wrong status'
            });
        } else {
            var repository = self.getURLRepo(url, status, page, onSuccess, onFailure);
            self.getScreenshot(repository, onSuccess, onFailure);
        };
    });

};

Crawler.prototype.getStars = function(stars) {
    var re = new RegExp(/(\d+,*\d*)/g);
    var stars = re.exec(stars);
    var starsFormatted = stars[0].replace(",","");
    return starsFormatted;
}

Crawler.prototype.getURLRepo = function(url, status, page, onSuccess, onFailure) {

    var self = this;

    page.onConsoleMessage = function (msg) {
        console.log(msg);
    };

    var repository = page.evaluate(function (getStars) {

        console.log("[] Checking list of respositories :");

        var upLimit = 200, downLimit = 100;

        var nodes = [], repositoryFounded = {}, matches = document.querySelectorAll(".d-block.width-full"), founded = false, i = 0;

        while(i < matches.length && founded == false) {

            var item = matches[i];
            var h3 = item.querySelector('h3');
            var link = h3.querySelector('a').href;
            var titleRepo = h3.outerText;
            var stars = item.querySelector('.text-gray .float-right').outerText;
            var numberStars = getStars(stars);

            console.log("[] Checking out " + titleRepo + " stars : " + numberStars);

            if(numberStars > downLimit && numberStars < upLimit) {
                repositoryFounded.title = titleRepo;
                repositoryFounded.stars = numberStars;
                repositoryFounded.link = link;
                founded = true;
                console.log('[OK] Founded repository ' + repositoryFounded.title + ' with ' + repositoryFounded.stars + ' stars and link: ' + repositoryFounded.link);
            }

            i++;

        }

        return repositoryFounded;

    }, self.getStars);

    if(!repository.link) {
        onFailure({
            url: url,
            status: status,
            message: 'There is not any repository in the current url that satisfy our rules.'
        });
    }

    return repository;

};

// New object and crawl url
var crawler = new Crawler();

crawler.crawl("https://github.com/trending", 
    function onSuccess(page) {
        console.log("[Success] URL = " + page.url + ", status = " + page.status + ". messsage: " + page.message);
        phantom.exit(1);
    }, 
    function onFailure(page) {
        console.log("[Error] URL = " +  page.url + ", status = " + page.status + ", message: " + page.message);
        phantom.exit(1);
    }
);
