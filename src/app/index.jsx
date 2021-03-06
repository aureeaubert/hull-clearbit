// /* global document */
//
// import React from "react";
// import ReactDOM from "react-dom";
// import { Provider } from "react-redux";
// import { AppContainer } from "react-hot-loader";
// import App from "./App";
// import store from "./store";
// import "../css/index.scss";
//
// const render = () => {
//   ReactDOM.render(
//     <AppContainer>
//       <Provider store={store}>
//         <App />
//       </Provider>
//     </AppContainer>,
//     document.getElementById("root")
//   );
// };
//
// export default render;

const $ = require("jquery");
const select2 = require("select2"); // eslint-disable-line no-unused-vars
const _ = require("lodash");

function renderResults(prospects) {
  const prospectsList = prospects
    .map(
      p =>
        `<tr>
    <td>${p.name.fullName}</td>
    <td>${p.email}</td>
    <td>${p.role}</td>
    <td>${p.seniority}</td>
    <td>${p.title}</td>
  </tr>`
    )
    .join("\n");

  return `
  <div class="panel panel-default">
    <div class="panel-heading text-center">
      <h5 class="uppercase text-accented mt-05 mb-05">
        ${prospects.length} Prospected users
      </h5>
    </div>
    <table class="table table-bordered table-responsive">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Seniority</th>
          <th>Title</th>
        </tr>
      </thead>
      <tbody id="results">
      ${prospectsList}
      </tbody>
    </table>
  </div>`;
}

export default function boot() {
  $(() => {
    $("#role").select2({
      closeOnSelect: true
    });
    $("#seniority").select2({
      closeOnSelect: true
    });
    $("#titles").select2({
      tags: true,
      closeOnSelect: true
    });

    $("form#prospect-form").on("submit", evt => {
      evt.preventDefault();
      const $btn = $("button#prospect");
      const titles = $("#titles")
        .val()
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const domains = $("#domains")
        .val()
        .split("\n")
        .map(d => d.trim())
        .filter(d => d.length > 0);

      if (domains.length > 0) {
        const data = { domains, titles };
        $btn.text("Prospecting...").attr("disabled", true);
        ["role", "seniority", "limit"].forEach(k => {
          const val = $(`#${k}`).val();
          if (val && val.length > 0) {
            data[k] = val;
          }
        });

        $.ajax({
          type: "POST",
          url: `/prospect${document.location.search}`,
          data,
          dataType: "json",
          timeout: 10000,
          statusCode: {
            503: (err, textstatus) => {
              if (textstatus === "timeout") {
                $("#results").html(
                  '<div class="alert alert-info" role="alert"><strong>It takes a while...</strong> Your request is taking more than 10 seconds and will continue in the background. Please check the Users list in Hull for the results in 5 or more minutes.</div>'
                );
              } else {
                $("#results").html(
                  `<div class="alert alert-error" role="alert"><strong>Oh snap!</strong> Something went wrong: ${err.toString()}.</div>`
                );
              }
            }
          }
        }).then(
          ({ prospects = [] }) => {
            $btn.text("Prospect").prop("disabled", false);
            $("#results").html(renderResults(_.flatten(prospects)));
          },
          (err, textstatus) => {
            $btn.text("Prospect").prop("disabled", false);
            if (textstatus === "timeout") {
              $("#results").html(
                '<div class="alert alert-info" role="alert"><strong>It takes a while...</strong> Your request is taking more than 10 seconds and will continue in the background. Please check the Users list in Hull for the results in 5 or more minutes.</div>'
              );
            } else if (err.responseJSON) {
              $("#results").html(
                `<div class="alert alert-error" role="alert"><strong>Oh snap!</strong> Something went wrong: ${
                  err.responseJSON.error
                }.</div>`
              );
            } else {
              $("#results").html(
                `<div class="alert alert-error" role="alert"><strong>Oh snap!</strong> Something went wrong: ${
                  err.responseText
                }.</div>`
              );
            }
          }
        );
      }
    });
  });
}
