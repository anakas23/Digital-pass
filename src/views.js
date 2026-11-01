
function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
${body}
</body>
</html>`;
}

function homePage(stats, user, passes) {
  let authPart;
  if (user) {
    authPart = `<p>Logged in as ${user.email || user.name} | <a href="/logout">Log out</a></p>`;
  } else {
    authPart = `<p><a href="/login">Log in</a></p>`;
  }

  let passesPart = '';
  if (user && passes) {
    const rows = passes.map((p) => `
      <tr>
        <td><a href="/info/${p.id}">${p.id}</a></td>
        <td>${p.name}</td>
        <td>${p.document}</td>
        <td>${p.issuedAt}</td>
        <td>${p.status}</td>
        <td>
          <form method="post" action="/admin/passes/${p.id}/cancel"><button>Cancel</button></form>
          <form method="post" action="/admin/passes/${p.id}/delete"><button>Delete</button></form>
        </td>
      </tr>`).join('');

    passesPart = `
      <h2>Passes</h2>
      <table border="1">
        <tr><th>ID</th><th>Name</th><th>Document</th><th>Issued at</th><th>Status</th><th>Actions</th></tr>
        ${rows}
      </table>`;
  }

  return layout('Digital Pass', `
    <h1>Digital Pass</h1>
    ${authPart}
    <p>Total passes: ${stats.total}</p>
    <p>Active passes: ${stats.active}</p>
    ${passesPart}
  `);
}

function passInfoPage(pass) {
  return layout('Pass info', `
    <h1>Pass info</h1>
    <p>Status: ${pass.status}</p>
    <p>Name: ${pass.name}</p>
    <p>Document: ${pass.document}</p>
    <p>Issued at: ${pass.issuedAt}</p>
  `);
}

function notFoundPage() {
  return layout('Not found', '<h1>404 - Pass not found</h1>');
}

module.exports = { homePage, passInfoPage, notFoundPage };