/// <reference types="../@types/jquery"/>
const ctx = document.getElementById("myChart");
const myModal = new bootstrap.Modal(document.getElementById("myModal"));
let filterByName = 0;
let filterByAmount = 0;
let isSearch = false;
let customersList = [];
let filterList = [];
let searchList = [];
let charObj;

// !=============================When Start==================================

$(async () => {
  
  $("body").css("overflowY", "hidden");

 
  $("#graph-page").fadeOut(0);
  let customers = await getCustomersData("customers");

  let transactions = await getCustomersData("transactions");
  $("label").animate({width:"35%"},800)

  customers.sort((a, b) => {
    return a.id - b.id;
  });

  transactions.sort((a, b) => {
    let x = new Date(a.date).getTime();
    let y = new Date(b.date).getTime();
    return y - x;
  });

  transactions.forEach((transaction, index) => {
    customersList.push({
      id: transaction.customer_id,
      name: customers[transaction.customer_id - 1].name,
      date: transaction.date,
      amount: transaction.amount,
    });
  });
  displayData(customersList);
});

// *=============================Events==================================

$("#fiter-name,#filter-amount").on("click", (e) => {
  let x;
  if (e.target.id == "fiter-name") {
    if (filterByAmount != 0) {
      filterByAmount = 0;
      $("#filter-amount").removeClass("sort-down sort-up");
    }
    filterByName = ++filterByName % 3;
    x = filterByName;
    filterData("name", filterByName);
  } else {
    console.log("amount", filterByName, e.target.id);
    if (filterByName != 0) {
      filterByName = 0;
      $("#fiter-name").removeClass("sort-down sort-up");
    }
    filterByAmount = ++filterByAmount % 3;
    x = filterByAmount;
    filterData("amount", filterByAmount);
  }

  if (x == 1) {
    e.target.classList.remove("sort-up");
    e.target.classList.add("sort-down");
  } else if (x == 2) {
    e.target.classList.remove("sort-down");
    e.target.classList.add("sort-up");
  } else {
    e.target.classList.remove("sort-down");
    e.target.classList.remove("sort-up");
  }
});
$("input").on("input", (e) => {
  if ($(e.target).val()) {
    isSearch = false;
  }
  search($(e.target).val());
});

$("#graph-page #my-btns button[id]").on("click", (e) => {
  console.log("sss", e.target.id);

  let data = charObj.data;
  charObj.destroy();
  charObj = createChart(data.datasets[0].data, data.labels, e.target.id);
});

$("#close").on("click", (e) => {
  $("#filter-amount").removeClass("sort-down sort-up");
  $("#fiter-name").removeClass("sort-down sort-up");
  $("label input").val('');
  displayData(customersList);
  $("#table-page").fadeIn(500);
  $("#graph-page").fadeOut(50);

});

// ?=============================Functions==================================

const getCustomersData = async (data = "customers") => {
  try {
    console.log("here");

    const responseCustomers = await fetch(`http://localhost:3000/${data}`);
    const customers = await responseCustomers.json();

    console.log(customers);
    return customers;
  } catch (error) {
   
    console.log(error);
    myModal.show();
  }
  finally{
    $(".loading-outer").fadeOut(500, () => {
      $("body").css("overflowY", "visible");
    });
  }

};
const filterData = (filter, state) => {
  let list = customersList;
  if (isSearch) {
    list = searchList;
  }
  filterList = [...list];

  console.log(filter, state);
  filterList.sort((a, b) => {
    let x = 1;
    if (state == 2) x = -1;

    if (filter == "name") {
      if (a[filter] < b[filter] && state == 1) {
        return -1;
      } else if (a[filter] > b[filter] && state == 1) {
        return 1;
      }
      if (a[filter] > b[filter] && state == 2) {
        return -1;
      } else if (a[filter] < b[filter] && state == 2) {
        return 1;
      }

      return 0;
    }

    return a[filter] * x - b[filter] * x;
  });

  console.log(filterList);
  // console.log(filterList[0][filter]);
  if (state !=0) {
    displayData(filterList);
  }
  else{
    displayData(searchList)
  }
};
const search = (about) => {
  isSearch = true;
  let list = customersList;
 
 
  
  searchList = list.filter((customer, index) => {
    if (Number(about)) {
      return (customer.amount + "").startsWith("" + about);
    } else {
      return customer.name.toLocaleLowerCase().includes(about.toLocaleLowerCase());
    }
  });
  
  if (filterByName || filterByAmount) {
    // list = filterList;
    let fiter ;
    let state;
    if (filterByName) {
      fiter="name";
      state=filterByName;
    }else{
      fiter="amount";
      state=filterByAmount;
    }
    filterData(fiter,state);
  }else{
    displayData(searchList);
  }
};

const displayData = (list) => {
  let temp = "";
  list.forEach((customer, index) => {
    temp += `
                <tr>
                  <td>${customer.id}</td>
                  <td>${customer.name}</td>
                  <td>${customer.date}</td>
                  <td>${customer.amount}</td>
                </tr>
    `;
  });

  $("tbody").html(temp);

  $("tbody tr").on("click", async (e) => {
    console.log("dnjk");
    let ele = $(e.currentTarget).css(
      "backgroundColor",
      "rgba(108, 37, 80, 0.5)"
    );
    ele.animate({ translate: "80%", opacity: "20%" }, 600).fadeOut(0);

    setTimeout(() => {
      goToChart(ele.children().eq(0).html());
    }, 600);
  });
};

const goToChart = (id) => {
  console.log(id);
  let list = customersList.filter((customer, index) => {
    return customer.id == id;
  });
  let amounts = list.map((customer, index) => {
    return customer.amount;
  });
  let dates = list.map((customer, index) => {
    let date = new Date(customer.date);
    return date.getDate() + " " + date.toDateString().substring(4, 7);
  });
  console.log(list, amounts, dates);

  $("#table-page").fadeOut(50);
  $("#graph-page").fadeIn(500);
  if (charObj) {
    charObj.destroy();
  }
  charObj = createChart(amounts, dates, "polarArea");
};

function createChart(amounts, dates, type = "bar") {
  return new Chart(ctx, {
    type: type,
    data: {
      labels: dates,
      datasets: [
        {
          label: "Amount Per Day",
          data: amounts,
          borderWidth: 1,

          // backgroundColor: null,
          // backgroundColor: [
          //   'rgba(255, 99, 132,0.8)',
          //   'rgba(255, 159, 64,0.8)',
          //   'rgba(255, 205, 86,0.8)',
          //   'rgba(75, 192, 192,0.8)',
          //   'rgba(54, 162, 234,0.8)',
          //   'rgba(153, 102, 254,0.8)',
          //   'rgba(201, 203, 207,0.8)'
          // ],
          // borderColor: [
          //   'rgb(255, 99, 132)',
          //   'rgb(255, 159, 64)',
          //   'rgb(255, 205, 86)',
          //   'rgb(75, 192, 192)',
          //   'rgb(54, 162, 235)',
          //   'rgb(153, 102, 255)',
          //   'rgb(201, 203, 207)'
          // ],
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      responsive: true,
      maintainAspectRatio: true,
      legend: {
        display: false,
      },
    },
  });
}
