// Title: Confluence_Filename_Fixer
// Author: Nicolas Kudeba
// Description: The following program converts Confluence HTML files to Markdown
// and places the Markdown files in a separate folder
// It first replaces the page### links with the more readable Confluence page header,
// then strips the style, script, and naviagation components, before using turndown
// to convert files to markdown. The files are then prepended with their titles.
//
// This script requires installation of node.js
//
// This script file must be placed in the same folder as downloaded Confluence files
var database = {};

//First install required node packages
var execSync = require("child_process").execSync,
  child;

child = execSync("npm install cheerio", function(error, stdout, stderr) {
  if (error !== null) {
    console.log("exec error: " + error);
  }
});
child = execSync("npm install turndown", function(error, stdout, stderr) {
  if (error !== null) {
    console.log("exec error: " + error);
  }
});
child = execSync("npm install prepend-file", function(error, stdout, stderr) {
  if (error !== null) {
    console.log("exec error: " + error);
  }
});

child = execSync("npm install replace-in-file", function(
  error,
  stdout,
  stderr
) {
  if (error !== null) {
    console.log("exec error: " + error);
  }
});

// Load node.js filesystem module
var fs = require("fs");
// Load cheerio module for HTML scraping
const cheerio = require("cheerio");
// Load find and replace module

// Retrieve main title
const indexpage = fs.readFileSync("index.html", "utf8");
const $index = cheerio.load(indexpage);
var links = $index("a").attr("href");
console.log(links);
const maintitle = fs.readFileSync(links, "utf8");
const $$maintitle = cheerio.load(maintitle);
// console.log($$);

const menuheader = $$maintitle(".page-title-lvl-cover").text();
console.log(menuheader);

const replace = require("replace-in-file");
// Make for loop that cycles through all files in folder
var stream = fs.createWriteStream("my_file.txt");

const TurndownService = require("turndown");

// Create an instance of the turndown service
let turndownService = new TurndownService();
turndownService.addRule("keep", {
    filter: ("img"),
    replacement: function(content, node) {
      return node.outerHTML;
    }
  });
  turndownService.remove(["style", "script", 'div class="navgroup"']);

// Use the turndown method from the created instance
// to convert the first argument (HTML string) to Markdown
var prependFile = require("prepend-file");

var database = {};

const CurrentFolder = "./";

// Create folder for Markdown Files
var dir = "./markdown_files";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}



const files = fs.readdirSync(CurrentFolder);
function extracttitle(files) {
  files.forEach(file => {
    // only modify files that contain 'page' and end in .html
    if (file.includes(".html")) {
      if (file.includes("page")) {
        const contents = fs.readFileSync(file, "utf8");
        // only modify files that contain a '.page-title-lvl-cover' heading (this is where confluence stores its header)
        if (contents.includes("page-title-lvl-cover")) {
          const $ = cheerio.load(contents);
          // Extract page title (found within page-title-lvl-cover class)
          const resulting = $(".page-title-lvl-cover").text();
          const result = resulting.replace(/\s+/g, "");

          //   createmd(result,findandreplace(file, result))
          //   findandreplace(file,result).then(createmd(result,fs.readFileSync(file, "utf8")));
          findandreplace(file, result);

          database[file] = result; // Create database file to save filename: header pairings
        }
      }
    }
  });
}

function makemd(files) {
  files.forEach(file => {
    // only modify files that contain 'page' and end in .html
    if (file.includes(".html")) {
      if (file.includes("page")) {
        const contents = fs.readFileSync(file, "utf8");
        // only modify files that contain a '.page-title-lvl-cover' heading
        if (contents.includes("page-title-lvl-cover")) {
          var x = contents;

          const $ = cheerio.load(contents);
          // Extract page title (found within page-title-lvl-cover class)
          const resulting = $(".page-title-lvl-cover").text();
          const result = resulting.replace(/\s+/g, "");

          //   createmd(result,findandreplace(file, result))
          //   findandreplace(file,result).then(createmd(result,fs.readFileSync(file, "utf8")));
          createmd(resulting, contents);
        }
      }
    }
  });
}


function findandreplace(file, result) {
  return new Promise(resolve => {
    const findtext = new RegExp(file, "g");

    const replacetext = result;
    const options = {
      files: "*.html", //replace Confluence filename in all HTML files in current folder
      from: [
        findtext,
        /(<div class="full-height-container">)(.*)(?=<div id="content")/s,
        /(<style)(.*)(style>)/s,
        /(<script>)(.*)(script>)/s,
        /(<pre class="syntaxhighlighter-pre"(.*)">)/gm,
        /<\/pre>/g
      ], //find this string in above files. Wrap in /text/g to replace all instances (regex syntax)
      to: [replacetext, "", "", "", "```sh\n", "\n```zz"] //replace with this string
    };

    try {
      const results = replace.sync(options);
      console.log("Replacement results:", results);
    } catch (error) {
      console.error("Error occurred:", error);
    } // <------ This is a thing
  });
}

function findandreplaceMD(file) {
  return new Promise(resolve => {

    const options = {
      files: file, //replace Confluence filename in all MD files in MD folder
      from: [/[\\]+`+[\\]+`+[\\]+`sh/g, /[\\]+`+[\\]+`+[\\]+`zz/g, /src="img/g, /img_.*?(")/g, /(?<=img_.*)\>|\/\>+?/g], //find this string in above files. Wrap in /text/g to replace all instances (regex syntax)
      to: ["```sh\n", "\n```", "src={require(\""+CurrentFolder+"img", (match) => match + ")}", "\/>"] //replace with this string
    };

    try {
      const results = replace.sync(options);
      console.log("Replacement results:", results);
    } catch (error) {
      console.error("Error occurred:", error);
    } // <------ This is a thing
  });
}

var gettitles = extracttitle(files);
makemd(files);
copyimages(files);
console.log(database);
fs.writeFileSync("database.json", JSON.stringify(database));

// Create Markdown Files
function createmd(title, contents) {
  const file_name = title.replace(/\s+/g, ""); // remove spaces from filename
  const title_fixed = title.replace(/:/g, ""); // remove special characters from title to avoid read errors
  let markdown = turndownService.turndown(contents);
  var mdfile = dir + "/" + file_name + ".md";
  console.log(mdfile);

  try {
    fs.writeFileSync(mdfile, markdown, "utf8");
  } catch (err) {
    // An error occurred
    console.error(err);
  }

  prependFile.sync(
    mdfile,
    "---\ntitle: " +
      title_fixed +
      "\n" +
      "route: " +
      "/" +
      file_name +
      "\n" +
      "menu: " +
      menuheader + //Give all Markdown files a navigation heading corresponding to the title of the parent Confluence file
      "\n---"
  );
  findandreplaceMD(mdfile)
}

function copyimages(files) {
  files.forEach(file => {
    // only copy .png files
    var destination = dir + "/" + file;
    if (file.includes(".png")||file.includes(".jpg")||file.includes(".bmp")||file.includes(".jpeg")||file.includes(".gif")||file.includes(".tif")||file.includes(".tiff")||file.includes(".raw")||file.includes(".psd")) {
        fs.copyFile(file, destination, (err) => {
            if (err) throw err;
            console.log('copied ' + file + ' to ' + destination);
          });
    }
  });
}