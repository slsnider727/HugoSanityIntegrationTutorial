module.exports = {
    onPreBuild: async ({ utils, packageJson }) => {
    console.log("my plugin loaded!")
    const fs = require('fs-extra')
    const toMarkdown = require("@sanity/block-content-to-markdown");
    const client = require("@sanity/client")({
      projectId: "uwiqys68",
      dataset: "production",
      useCdn: false,
    });
    
    //add any serializers for your portable text
    const serializers = {
      types: {
        code: (props) =>
          "```" + props.node.language + "\n" + props.node.code + "\n```",
      },
    };
    fs.readdir("./content", (err, files) => { 
        if (err) 
        console.log(err); 
        else { 
          files.forEach(file => { 
            fs.unlink(`content//${file}`, err => {
              if (err) throw err;
            })
          }) 
        }
        })
        //import modules and define some terms
        try {
        //get sanity data
        //then output as md files in our content folder
        await client
        //fetch our post data from the Sanity client using GROQ
        .fetch(`
        *[_type == "post"]{categories[]->{title}, date, slug, title, body}
          `)
        .then((res) =>
        //when we receive it, we'll loop through all our posts...
          res.map(async (post) => {
          //...and initialize YAML frontmatter with three hyphens...
          let frontmatter = "---";
          //... then we'll use the Object.keys() method,
          //which will return each of our Sanity fields
          Object.keys(post).forEach((field) => {
          //if the field is slug, we retrieve the current value
            if (field === "slug") {
              return (
                frontmatter += `\n${field}: "${post.slug.current}"`
                );
              } else if (field === "categories") {
              //if the field is the categories array, 
              //we output each category's title
              return (frontmatter += `\n${field}: [${post.categories.map(
                (cat) => `"${cat.title}"`
                )}]`);
            //if the field is the body, we skip it
                } else if (field === "body") {
                  return;
            //and for every other field we output the value of that post
                } else {
                frontmatter += `\n${field}: "${post[field]}"`;
                }
              });
            //then we end the frontmatter with three more hyphens
          frontmatter += "\n---\n\n";

          const wholePost = `${frontmatter}${toMarkdown(post.body, {
            serializers,
            })}`;

        const filePath = `./content/${post.slug.current}.md`;
        fs.outputFile(filePath, wholePost, function (err,data) {
        if (err) {
        return console.log(err);
    }
    });
    })
    )
} catch (error) {
    utils.build.failBuild('Failure message', { error })
    }
  },
  }