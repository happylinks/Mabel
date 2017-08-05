const gh = require('./github-client');
const ghsearch = gh.search();

const PRLine = ({ number, html_url, title, assignees }) => `\`#${number}\` <${html_url}|${title}> ${assignees.length ? '(' + assignees.join() + ')' : ''} \n`;

const prsWithLabel = (repo, label) => new Promise(resolve =>
    ghsearch.issues({
        q: `is:pr+is:open+label:"${label}"+repo:${repo}`,
    }, (err, data) => resolve(data.items))
);

const createReviewRequests = (pr, usernames) => new Promise(resolve =>
    pr.createReviewRequests(usernames, (err, data) => resolve(data))
);

const repo = 'bynder/bynder-spa-frontend';

async function command(input) {
    const text = input.text;

    // Command text.
    const firstPart = text.split(' ')[0];
    // Text after command.
    const afterText = text.replace(`${firstPart} `, '');

    switch (firstPart) {
        case 'label':
            const label = afterText;

            const prs = await prsWithLabel(repo, label);

            return {
                'response_type': 'in_channel',
                'attachments': [
                    {
                        "pretext": `Current open PR's with label _${afterText}_`,
                        "text": prs.map(pr => PRLine(pr)).join(''),
                        "mrkdwn_in": [
                            "text",
                            "pretext"
                        ]
                    }
                ]
            };
            break;
        case 'review':
            const parts = afterText.split(' ');
            const number = parts[0];
            const usernames = parts.slice(1);

            const pr = gh.pr(repo, number);
            const result = createReviewRequests(pr, usernames);
            console.log(result);

            return {
                'response_type': 'in_channel',
                'attachments': [
                    {
                        "pretext": `PR \`#${number}\` assigned to ${usernames.join(', ')}`,
                        "mrkdwn_in": [
                            "pretext",
                        ]
                    }
                ]
            };

            break;
    }
};

module.exports = {
    command,
};
