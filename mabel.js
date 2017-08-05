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

const ghInfo = (object) => new Promise(resolve =>
    object.info((err, data) => resolve(data))
);

const repo = 'bynder/bynder-spa-frontend';

const usernameMapping = {
    'michiel': 'happylinks',
};

async function command(data) {
    const text = data.text;

    // Command text.
    const firstPart = text.split(' ')[0];
    // Text after command.
    const afterText = text.replace(`${firstPart} `, '');

    switch (firstPart) {
        case 'label': {
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
        }
        case 'review': {
            const parts = afterText.split(' ');
            const number = parts[0];
            const usernames = parts.slice(1);

            const pr = gh.pr(repo, number);
            createReviewRequests(pr, usernames);

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
        case 'request': {
            const parts = afterText.split(' ');
            const number = parts[1];

            const pr = gh.issue(repo, number);

            const prInfo = await ghInfo(pr);

            return {
                'response_type': 'in_channel',
                'attachments': [
                    {
                        "callback_id": "pr_request_response",
                        "fallback": "PR Request.",
                        "pretext": `${prInfo.user.login} is asking for a PR review, do you want to pick it up?`,
                        "author_name": prInfo.user.login,
                        "author_link": prInfo.user.html_url,
                        "title": prInfo.title,
                        "title_link": prInfo.pull_request.html_url,
                        "text": prInfo.body,
                        "actions": [
                            {
                                "name": "yes",
                                "text": "I do!",
                                "type": "button",
                                "style": "primary",
                                "value": number,
                            },
                            {
                                "name": "no",
                                "text": "No thanks!",
                                "type": "button",
                                "style": "danger",
                            }
                        ]
                    }
                ]
            };

            break;
        }
    }
};

async function interactive(data) {
    const payload = JSON.parse(data.payload);
    const callback_id = payload.callback_id;
    const original_message = payload.original_message;
    const username = payload.user.name; // This isn't github username yet. :(
    const githubUsername = usernameMapping[username];

    switch (callback_id) {
        case 'pr_request_response': {
            const action = payload.actions[0];
            const actionName = action.name;

            if (actionName === 'yes') {
                const actionValue = action.value;
                const number = parseInt(actionValue, 10);

                const pr = gh.pr(repo, number);
                createReviewRequests(pr, [githubUsername]);

                const new_message = original_message;
                delete new_message.attachments[0].actions;

                new_message.attachments.push({
                    "color": "#36a64f",
                    "title": "PR is picked up",
                    "text": `The PR is picked up by ${githubUsername}.`
                });

                return new_message;
            } else {
                return false;
            }
            break;
        }
    }
}

module.exports = {
    command,
    interactive,
};
