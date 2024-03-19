const db = require("../config/connection");
const collection = "products";
const Products = require("../models/products");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const Users = require("../models/user");
const Order = require("../models/order");
const { Console } = require("console");



async function salesForDate(date) {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: new Date(dateString),
            $lt: new Date(dateString + "T23:59:59"),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    return result.length;
  } catch (error) {
    throw error;
  }
}



async function salesForDateRange(startDate, endDate) {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    return result.length;
  } catch (error) {
    throw error;
  }
}



exports.numberSales = async () => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Get yesterday's date

    const todaySalesNumber = await salesForDate(today);
    let yesterdaySalesNumber = await salesForDate(yesterday);
    let salesChange = todaySalesNumber - yesterdaySalesNumber;
    if(yesterdaySalesNumber === 0){
        yesterdaySalesNumber=2;
    }

    let changeDescription;
    if (salesChange > 0) {
      changeDescription = "increase";
    } else if (salesChange < 0) {
        salesChange=parseFloat(salesChange)*(-1);
      changeDescription = "decrease";
    } else {
      changeDescription = "remain unchanged";
    }

    let salespercentage =(salesChange / yesterdaySalesNumber)*100;


    return {
      today:todaySalesNumber,
      yesterday:yesterdaySalesNumber,
      percentage: salespercentage.toFixed(2) + "%",
      description:changeDescription,
    };


  } catch (error) {
    return { error };
  }
};



exports.monthlynumberSales=async()=>{
    try {
      const today = new Date();
      const startDateOfWeek = new Date(today);
      startDateOfWeek.setDate(today.getDate() - today.getDay()); // Start of the current week (Sunday)
      const endDateOfWeek = new Date(today);
      endDateOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of the current week (Saturday)

      const startDateOfPreviousWeek = new Date(startDateOfWeek);
      startDateOfPreviousWeek.setDate(startDateOfWeek.getDate() - 7); // Start of the previous week
      const endDateOfPreviousWeek = new Date(endDateOfWeek);
      endDateOfPreviousWeek.setDate(endDateOfWeek.getDate() - 7); // End of the previous week

      const thisWeekSalesNumber = await salesForDateRange(startDateOfWeek,endDateOfWeek);
      let previousWeekSalesNumber = await salesForDateRange(startDateOfPreviousWeek,endDateOfPreviousWeek);
      if(previousWeekSalesNumber===0){
        previousWeekSalesNumber=4;
      }

      let salesChange = thisWeekSalesNumber - previousWeekSalesNumber;
      let changeDescription;
      if (salesChange > 0) {
        changeDescription = "increase";
      } else if (salesChange < 0) {
                changeDescription = "decrease";
        salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
      } else {
        changeDescription = "remain unchanged";
      }

      let salesPercentage = (salesChange / previousWeekSalesNumber) * 100;
      if(salesPercentage >100){
        salesPercentage=salesPercentage/10;
      }
        console.log("pree:", salesChange / previousWeekSalesNumber);
      console.log("This week's sales:", thisWeekSalesNumber);
      console.log("Previous week's sales:", previousWeekSalesNumber);
      console.log("Percentage change:", salesPercentage.toFixed(2) + "%");

      return {
        today: thisWeekSalesNumber,
        yesterday: previousWeekSalesNumber,
        description: changeDescription,
        percentage: salesPercentage.toFixed(2) + "%",
      };
    } catch (error) {
      return { error };
    }
}


exports.yearlynumberSales=async()=>{
    try {
      const today = new Date();
      

      const startDateOfYear = new Date(today.getFullYear(), 0, 1); // Start of the current year
      const endDateOfYear = new Date(today.getFullYear() + 1, 0, 1); // Start of the next year

      const startDateOfPreviousYear = new Date(today.getFullYear() - 1, 0, 1); // Start of the previous year
      const endDateOfPreviousYear = new Date(today.getFullYear(), 0, 1); // Start of the current year

      const thisYearSalesNumber = await salesForDateRange(
        startDateOfYear,
        endDateOfYear
      );
      let previousYearSalesNumber = await salesForDateRange(
        startDateOfPreviousYear,
        endDateOfPreviousYear
      );

      let salesChange = thisYearSalesNumber - previousYearSalesNumber;
      let changeDescription;
      if (salesChange > 0) {
        changeDescription = "increase";
      } else if (salesChange < 0) {
        salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
        changeDescription = "decrease";
      } else {
        changeDescription = "remain unchanged";
      }
      if(previousYearSalesNumber===0){
        previousYearSalesNumber=6;
      }
      let salesPercentage =
        ((thisYearSalesNumber - previousYearSalesNumber) /
          previousYearSalesNumber) *
        100;


        if (salesPercentage > 100) {
          salesPercentage = salesPercentage / 10;
        }
      console.log("This year's sales:", thisYearSalesNumber);
      console.log("Previous year's sales:", previousYearSalesNumber);
      console.log("Percentage change:", salesPercentage.toFixed(2) + "%");

      return {
        today: thisYearSalesNumber,
        yesterday: previousYearSalesNumber,
        description: changeDescription,
        percentage: salesPercentage.toFixed(2) + "%",
        
      };
    } catch (error) {
      return { error };
    }
}

//***************starting revenue****************** */
async function revenueForDate(date) {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

   const orders = await Order.aggregate([
     {
       $match: {
         status: { $in: ["placed", "delivered"] },
         date: {
           $gte: new Date(dateString),
           $lt: new Date(dateString + "T23:59:59"),
         },
       },
     },
   ]);

   let totalRevenue = 0;

   orders.forEach((order) => {
     totalRevenue += order.totalAmount; // Sum up the total amount of each order to get the total revenue
   });

   return totalRevenue;
  } catch (error) {
    throw error;
  }
}


async function revenueForDateRange(startDate, endDate) {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        },
      },
    ]);
console.log("orders:",orders)
     let totalRevenue = 0;

     orders.forEach((order) => {
       totalRevenue += order.totalAmount; // Sum up the total amount of each order to get the total revenue
     });
     console.log("total revenueee:", totalRevenue);

     return totalRevenue;
  } catch (error) {
    throw error;
  }
}



exports.revenuedaily=async()=>{
    try {
     const today = new Date();
     const yesterday = new Date(today);
     yesterday.setDate(today.getDate() - 1); // Get yesterday's date

     const todayRevenue = await revenueForDate(today);
     const yesterdayRevenue = await revenueForDate(yesterday);
      let salesChange = todayRevenue - yesterdayRevenue;
      if (salesChange > 0) {
        changeDescription = "increase";
      } else if (salesChange < 0) {
        salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
        changeDescription = "decrease";
      } else {
        changeDescription = "remain unchanged";
      }
      

     let revenueChangePercentage = 0;
     if (yesterdayRevenue !== 0) {
       revenueChangePercentage =
         ((salesChange) / yesterdayRevenue) * 100;
     }

     return {
       today: todayRevenue,
       yesterday: yesterdayRevenue,
       percentage: revenueChangePercentage.toFixed(2) + "%",
       description: changeDescription,
     };
    } catch (error) {
      return { error };
    }
}




exports.revenueMonthly=async()=>{
    try {
      const today = new Date();
      const startDateOfWeek = new Date(today);
      startDateOfWeek.setDate(today.getDate() - today.getDay()); // Start of the current week (Sunday)
      const endDateOfWeek = new Date(today);
      endDateOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of the current week (Saturday)

      const startDateOfPreviousWeek = new Date(startDateOfWeek);
      startDateOfPreviousWeek.setDate(startDateOfWeek.getDate() - 7); // Start of the previous week
      const endDateOfPreviousWeek = new Date(endDateOfWeek);
      endDateOfPreviousWeek.setDate(endDateOfWeek.getDate() - 7); // End of the previous week

      const thisWeekSalesNumber = await revenueForDateRange(
        startDateOfWeek,
        endDateOfWeek
      );
      let previousWeekSalesNumber = await revenueForDateRange(
        startDateOfPreviousWeek,
        endDateOfPreviousWeek
      );
      if (previousWeekSalesNumber === 0) {
        previousWeekSalesNumber = 12000;
      }

      let salesChange = thisWeekSalesNumber - previousWeekSalesNumber;
      let changeDescription;
      if (salesChange > 0) {
        changeDescription = "increase";
      } else if (salesChange < 0) {
        salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
        changeDescription = "decrease";
      } else {
        changeDescription = "remain unchanged";
      }

      let salesPercentage = (salesChange / previousWeekSalesNumber) * 100;
      if (salesPercentage > 100) {
        salesPercentage = salesPercentage / 10;
      }


      return {
        today: thisWeekSalesNumber,
        yesterday: previousWeekSalesNumber,
        description: changeDescription,
        percentage: salesPercentage.toFixed(2) + "%",
      };
    } catch (error) {
      return { error };
    }

}




exports.revenueYearly=async()=>{
    try{
    const today = new Date();
      const startDateOfYear = new Date(today.getFullYear(), 0, 1); // Start of the current year
      const endDateOfYear = new Date(today.getFullYear() + 1, 0, 1); // Start of the next year

      const startDateOfPreviousYear = new Date(today.getFullYear() - 1, 0, 1); // Start of the previous year
      const endDateOfPreviousYear = new Date(today.getFullYear(), 0, 1); // Start of the current year

      const thisYearSalesNumber = await revenueForDateRange(
        startDateOfYear,
        endDateOfYear
      );
      let previousYearSalesNumber = await revenueForDateRange(
        startDateOfPreviousYear,
        endDateOfPreviousYear
      );

      let salesChange = thisYearSalesNumber - previousYearSalesNumber;
      let changeDescription;
      if (salesChange > 0) {
        changeDescription = "increase";
      } else if (salesChange < 0) {
        salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
        changeDescription = "decrease";
      } else {
        changeDescription = "remain unchanged";
      }
      if(previousYearSalesNumber===0){
        previousYearSalesNumber=60000;
      }
      let salesPercentage =(salesChange /previousYearSalesNumber) *100;


        if (salesPercentage > 100) {
          salesPercentage = salesPercentage / 10;
        }
      console.log("This year's sales:", thisYearSalesNumber);
      console.log("Previous year's sales:", previousYearSalesNumber);
      console.log("Percentage change:", salesPercentage.toFixed(2) + "%");

      return {
        today: thisYearSalesNumber,
        yesterday: previousYearSalesNumber,
        description: changeDescription,
        percentage: salesPercentage.toFixed(2) + "%",
        
      };
    } catch (error) {
      return { error };
    }

}

//***************ending revenue****************** */


//*********************starting numberUsers*************************/
async function dayRegisterdUser(date){
  try{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

    const no_User = await Users.aggregate([
      {
        $match: {
          verified: true,
          date: {
            $gte: new Date(dateString),
            $lt: new Date(dateString + "T23:59:59"),
          },
        },
      },
    ]);
    number=no_User.length
    return number;
  }catch(error){
    console.log("error:",error)
  }

}


async function rangeRegisterdUser(startDate,endDate) {
  try {
  const no_users = await Users.aggregate([
    {
      $match: {
        verified:true,
        date: {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        },
      },
    },
  ]);

  number = no_users.length;
  return number;
  } catch (error) {
    console.log("error:", error);
  }
}

exports.numberUsers=async()=>{
  try{
   const today = new Date();
   const yesterday = new Date(today);
   yesterday.setDate(today.getDate() - 1);

   const todayUser=await dayRegisterdUser(today)
   let yesterdayUser = await dayRegisterdUser(yesterday);
   if(yesterdayUser===0){
      yesterdayUser=11;
   }
    let change=todayUser-yesterdayUser;
    let changeDescription;
    if (change > 0) {
      changeDescription = "increase";
    } else if (change < 0) {
      change = Math.abs(change); 
      changeDescription = "decrease";
    } else {
      changeDescription = "remain unchanged";
    }
    percentage=(change/yesterdayUser)*100;
    return {
      today: todayUser,
      yesterday: yesterdayUser,
      description: changeDescription,
      percentage: percentage.toFixed(2) + "%",
    };

  
  }catch(error){
    console.log("error:",error)
  }

}


exports.monthlyUsers=async(req,res)=>{
  try{
const today = new Date();
const startDateOfWeek = new Date(today);
startDateOfWeek.setDate(today.getDate() - today.getDay()); // Start of the current week (Sunday)
const endDateOfWeek = new Date(today);
endDateOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of the current week (Saturday)

const startDateOfPreviousWeek = new Date(startDateOfWeek);
startDateOfPreviousWeek.setDate(startDateOfWeek.getDate() - 7); // Start of the previous week
const endDateOfPreviousWeek = new Date(endDateOfWeek);
endDateOfPreviousWeek.setDate(endDateOfWeek.getDate() - 7); // End of the previous week

const thisWeekSalesNumber = await rangeRegisterdUser(
  startDateOfWeek,
  endDateOfWeek
);
let previousWeekSalesNumber = await rangeRegisterdUser(
  startDateOfPreviousWeek,
  endDateOfPreviousWeek
);
if (previousWeekSalesNumber === 0) {
  previousWeekSalesNumber = 15;
}

let salesChange = thisWeekSalesNumber - previousWeekSalesNumber;
let changeDescription;
if (salesChange > 0) {
  changeDescription = "increase";
} else if (salesChange < 0) {
  salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
  changeDescription = "decrease";
} else {
  changeDescription = "remain unchanged";
}

let salesPercentage = (salesChange / previousWeekSalesNumber) * 100;
if (salesPercentage > 100) {
  salesPercentage = salesPercentage / 10;
}

return {
  today: thisWeekSalesNumber,
  yesterday: previousWeekSalesNumber,
  description: changeDescription,
  percentage: salesPercentage.toFixed(2) + "%",
};

  }catch(error){

  }

}



exports.yearlyUsers = async () => {
  try {
    const today = new Date();
    const startDateOfYear = new Date(today.getFullYear(), 0, 1); // Start of the current year
    const endDateOfYear = new Date(today.getFullYear() + 1, 0, 1); // Start of the next year

    const startDateOfPreviousYear = new Date(today.getFullYear() - 1, 0, 1); // Start of the previous year
    const endDateOfPreviousYear = new Date(today.getFullYear(), 0, 1); // Start of the current year

    const thisYearSalesNumber = await rangeRegisterdUser(
      startDateOfYear,
      endDateOfYear
    );
    let previousYearSalesNumber = await rangeRegisterdUser(
      startDateOfPreviousYear,
      endDateOfPreviousYear
    );

    let salesChange = thisYearSalesNumber - previousYearSalesNumber;
    let changeDescription;
    if (salesChange > 0) {
      changeDescription = "increase";
    } else if (salesChange < 0) {
      salesChange = Math.abs(salesChange); // Get the absolute value of salesChange
      changeDescription = "decrease";
    } else {
      changeDescription = "remain unchanged";
    }
    if (previousYearSalesNumber === 0) {
      previousYearSalesNumber = 60000;
    }
    let salesPercentage = (salesChange / previousYearSalesNumber) * 100;

    if (salesPercentage > 100) {
      salesPercentage = salesPercentage / 10;
    }
    console.log("This year's sales:", thisYearSalesNumber);
    console.log("Previous year's sales:", previousYearSalesNumber);
    console.log("Percentage change:", salesPercentage.toFixed(2) + "%");

    return {
      today: thisYearSalesNumber,
      yesterday: previousYearSalesNumber,
      description: changeDescription,
      percentage: salesPercentage.toFixed(2) + "%",
    };
  } catch (error) {
    return { error };
  }
};
//*********************ending dashboard*************************/



exports.weekrevenue = async () => {
  try {
    const today = new Date();
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const revenueByDay = {};

    let totalRevenue = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - today.getDay() + i); // Get the date for the current day of the week
      const dayIndex = currentDate.getDay();
      const todayDay = daysOfWeek[dayIndex];
      const revenue = await revenueForDate(currentDate);
      totalRevenue += revenue;
      revenueByDay[todayDay] = revenue;
    }

    // Normalize data to percentages
    for (const day in revenueByDay) {
      revenueByDay[day] = Math.floor((revenueByDay[day] / totalRevenue) * 100);
    }

    console.log("revenue by week day::", revenueByDay.Friday);
    return revenueByDay;
  } catch (error) {
    return { error };
  }
};



exports.weeksales=async()=>{

  try {
    const today = new Date();
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const salesByDay = {};

    let totalSales = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - today.getDay() + i); // Get the date for the current day of the week
      const dayIndex = currentDate.getDay();
      const todayDay = daysOfWeek[dayIndex];
      const sales = await salesForDate(currentDate);
      totalSales += sales;
      salesByDay[todayDay] = sales;
    }

    // Normalize data to percentages
    for (const day in salesByDay) {
      if(totalSales!==0){
      salesByDay[day] = Math.floor((salesByDay[day] / totalSales) * 100);
      }
    }

    console.log("sales by week day::", salesByDay.Friday);
    return salesByDay;
  } catch (error) {
    return { error };
  }

}



exports.weekcustomers=async()=>{
  try {
    const today = new Date();
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const userByDay = {};

    let totalUser = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - today.getDay() + i); // Get the date for the current day of the week
      const dayIndex = currentDate.getDay();
      const todayDay = daysOfWeek[dayIndex];
      const user = await dayRegisterdUser(currentDate);
      totalUser += user;
      userByDay[todayDay] = user;
    }

    // Normalize data to percentages
    for (const day in userByDay) {
      if (totalUser !== 0) {
        userByDay[day] = Math.floor((userByDay[day] / totalUser) * 100);
      }
    }

    console.log("user by week day::", userByDay.Friday);
    return userByDay;
  } catch (error) {
    return { error };
  }

}



exports.yearRevenue = async () => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = [];
    const revenueByYear = {};

    // Construct an array of the past 7 years including the current year
    for (let i = 0; i < 7; i++) {
      years.push(currentYear - i);
    }

    let totalRevenue = 0;

    // Loop through each year to calculate revenue
    for (const year of years) {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year + 1, 0, 1); // January 1st of the next year
      const revenue = await revenueForDateRange(startDate, endDate);
      totalRevenue += revenue;

      revenueByYear[year] = revenue;
    }

    // Calculate percentage for each year
    for (const year of years) {
      revenueByYear[year] = Math.floor(
        (revenueByYear[year] / totalRevenue) * 100
      );
    }
        console.log("month rev:", revenueByYear);

    return revenueByYear;
  } catch (error) {
    return { error };
  }
};





exports.yearsales=async()=>{

  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = [];
    const revenueByYear = {};

    // Construct an array of the past 7 years including the current year
    for (let i = 0; i < 7; i++) {
      years.push(currentYear - i);
    }

    let totalRevenue = 0;

    // Loop through each year to calculate revenue
    for (const year of years) {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year + 1, 0, 1); // January 1st of the next year
      const revenue = await salesForDateRange(startDate, endDate);
      totalRevenue += revenue;

      revenueByYear[year] = revenue;
    }

    // Calculate percentage for each year
    for (const year of years) {
      revenueByYear[year] = Math.floor(
        (revenueByYear[year] / totalRevenue) * 100
      );
    }
    return revenueByYear;
  } catch (error) {
    return { error };
  }

}



exports.yearcustomers=async()=>{
  
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = [];
    const revenueByYear = {};

    // Construct an array of the past 7 years including the current year
    for (let i = 0; i < 7; i++) {
      years.push(currentYear - i);
    }

    let totalRevenue = 0;

    // Loop through each year to calculate revenue
    for (const year of years) {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year + 1, 0, 1); // January 1st of the next year
      const revenue = await rangeRegisterdUser(startDate, endDate);
      totalRevenue += revenue;

      revenueByYear[year] = revenue;
    }

    // Calculate percentage for each year
    for (const year of years) {
      revenueByYear[year] = Math.floor(
        (revenueByYear[year] / totalRevenue) * 100
      );
    }
    return revenueByYear;
  } catch (error) {
    return { error };
  }

}



exports.monthlyRevenue = async () => {
  try {
    const today = new Date();
    const months = [];
    const revenueByMonth = {};

    // Construct an array of the past 12 months starting from the current month
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.unshift(monthDate); // Add the month to the beginning of the array
    }

    let totalRevenue = 0;

    // Loop through each month to calculate revenue
    for (const month of months) {
      // Get the start and end date of the month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      console.log("startttt:",startDate,endDate)
      // Calculate revenue for the month
      const revenue = await revenueForDateRange(startDate, endDate);
      totalRevenue += revenue;

      // Store the revenue for the month
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      revenueByMonth[monthKey] = revenue;
    }

    // Calculate percentage for each month
    for (const monthKey in revenueByMonth) {
      revenueByMonth[monthKey] = Math.floor(
        (revenueByMonth[monthKey] / totalRevenue) * 100
      );
    }
    console.log("month rev:",revenueByMonth)
    return revenueByMonth;
  } catch (error) {
    console.log("errrr.",error)
    return { error };
  }
};



exports.monthlysales=async()=>{
  try {
    const today = new Date();
    const months = [];
    const revenueByMonth = {};

    // Construct an array of the past 12 months starting from the current month
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.unshift(monthDate); // Add the month to the beginning of the array
    }

    let totalRevenue = 0;

    // Loop through each month to calculate revenue
    for (const month of months) {
      // Get the start and end date of the month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      console.log("startttt:", startDate, endDate);
      // Calculate revenue for the month
      const revenue = await salesForDateRange(startDate, endDate);
      totalRevenue += revenue;

      // Store the revenue for the month
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      revenueByMonth[monthKey] = revenue;
    }

    // Calculate percentage for each month
    for (const monthKey in revenueByMonth) {
      revenueByMonth[monthKey] = Math.floor(
        (revenueByMonth[monthKey] / totalRevenue) * 100
      );
    }
    console.log("month rev:", revenueByMonth);
    return revenueByMonth;
  } catch (error) {
    console.log("errrr.", error);
    return { error };
  }

}


exports.monthlycustomers = async () => {
  try {
    const today = new Date();
    const months = [];
    const revenueByMonth = {};

    // Array of month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Construct an array of the past 12 months starting from the current month
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.unshift(monthDate); // Add the month to the beginning of the array
    }

    let totalRevenue = 0;

    // Loop through each month to calculate revenue
    for (const month of months) {
      // Get the start and end date of the month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Calculate revenue for the month
      const revenue = await rangeRegisterdUser(startDate, endDate);
      totalRevenue += revenue;

      // Store the revenue for the month
      const monthKey = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
      revenueByMonth[monthKey] = revenue;
    }

    // Calculate percentage for each month
    for (const monthKey in revenueByMonth) {
      revenueByMonth[monthKey] = Math.floor(
        (revenueByMonth[monthKey] / totalRevenue) * 100
      );
    }

    console.log("month rev:", revenueByMonth);
    return revenueByMonth;
  } catch (error) {
    console.log("errrr.", error);
    return { error };
  }
};


exports.topProductsWeek=async()=>{
  try{
    const startDate = new Date(); // Start date for the date range (current date)
    startDate.setDate(startDate.getDate() - 7); // Subtract 7 days from the current date
    const endDate = new Date();
       const result = await Order.aggregate([
         {
           $match: {
             status: { $in: ["placed", "delivered"] },
             date: {
               $gte: startDate,
               $lt: endDate,
             },
           },
         },
         {
           $unwind: "$products",
         },
         {
           $addFields: {
             itemId: { $toObjectId: "$products.item" },
           },
         },
         {
           $lookup: {
             from: "products", // Collection name for products
             localField: "itemId",
             foreignField: "_id",
             as: "productDetails",
           },
         },
         {
           $group: {
             _id: "$products.item",
             productName: {
               $first: { $arrayElemAt: ["$productDetails.Name", 0] },
             },
             price: {
               $first: { $arrayElemAt: ["$productDetails.price", 0] },
             },
             quantitySold: { $sum: "$products.quantity" },
             revenue: { $sum: "$totalAmount" },
             images: {
               $first: { $arrayElemAt: ["$productDetails.images", 0] },
             },
           },
         },
         {
           $sort: { quantitySold: -1 }, // Sort products by quantitySold in descending order
         },
         {
           $limit: 10, // Limit the result to top 10 products
         },
       ]);


    console.log("topSellingProducts:",result);
    return result;
  }catch(error){

  }
}



exports.topBrands=async()=>{
  try {
    const startDate = new Date(); // Start date for the date range (current date)
    startDate.setDate(startDate.getDate() - 7); // Subtract 7 days from the current date
    const endDate = new Date();

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.brand",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);

    console.log("topBrands:", result);
    return result;
  } catch (error) {
    console.error("Error fetching top brands:", error);
  }
};



exports.topCategories = async () => {
  try {
    const startDate = new Date(); // Start date for the date range (current date)
    startDate.setDate(startDate.getDate() - 7); // Subtract 7 days from the current date
    const endDate = new Date();

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $unwind: "$productDetails.Category", // Unwind the Category array
      },
      {
        $group: {
          _id: "$productDetails.Category",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);
    return result;
  } catch (error) {
    console.error("Error fetching top categories:", error);
  }
};




exports.topProductsMonth = async () => {
  try {
    const endDate = new Date(); // End date is the current date
    const startDate = new Date(endDate); // Start date is 30 days before the current date
    startDate.setDate(startDate.getDate() - 30);

    console.log("start:", startDate, "end:", endDate);
    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$products.item",
          productName: {
            $first: { $arrayElemAt: ["$productDetails.Name", 0] },
          },
          price: {
            $first: { $arrayElemAt: ["$productDetails.price", 0] },
          },
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
          images: {
            $first: { $arrayElemAt: ["$productDetails.images", 0] },
          },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort products by quantitySold in descending order
      },
      {
        $limit: 10, // Limit the result to top 10 products
      },
    ]);

    console.log("topSellingProducts Month:", result);
    return result;
  } catch (error) {}
};



exports.topProductsYear = async () => {
  try {
    const startDate = new Date(new Date().getFullYear(), 0, 1); // Start date is the beginning of the current year
    const endDate = new Date(); 

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $group: {
          _id: "$products.item",
          productName: {
            $first: { $arrayElemAt: ["$productDetails.Name", 0] },
          },
          price: {
            $first: { $arrayElemAt: ["$productDetails.price", 0] },
          },
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
          images: {
            $first: { $arrayElemAt: ["$productDetails.images", 0] },
          },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort products by quantitySold in descending order
      },
      {
        $limit: 10, // Limit the result to top 10 products
      },
    ]);

    console.log("topSellingProducts Year:", result);
    return result;
  } catch (error) {}
};





exports.topBrandsMonth = async () => {
  try {
    const endDate = new Date(); // End date is the current date
    const startDate = new Date(endDate); // Start date is 30 days before the current date
    startDate.setDate(startDate.getDate() - 30);

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.brand",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);

    console.log("topBrands:", result);
    return result;
  } catch (error) {
    console.error("Error fetching top brands:", error);
  }
};



exports.topBrandsYearly = async () => {
  try {
    const startDate = new Date(new Date().getFullYear(), 0, 1); // Start date is the beginning of the current year
    const endDate = new Date();

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $group: {
          _id: "$productDetails.brand",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);

    console.log("topBrands:", result);
    return result;
  } catch (error) {
    console.error("Error fetching top brands:", error);
  }
};







exports.topCategoriesMonthly= async () => {
  try {
    const endDate = new Date(); // End date is the current date
    const startDate = new Date(endDate); // Start date is 30 days before the current date
    startDate.setDate(startDate.getDate() - 30);

    console.log("start:", startDate, "end:", endDate);

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $unwind: "$productDetails.Category", // Unwind the Category array
      },
      {
        $group: {
          _id: "$productDetails.Category",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);
    return result;
  } catch (error) {
    console.error("Error fetching top categories:", error);
  }
};





exports.topCategoriesYearly= async () => {
  try {
    const startDate = new Date(new Date().getFullYear(), 0, 1); // Start date is the beginning of the current year
    const endDate = new Date();
    console.log("start:", startDate, "end:", endDate);

    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["placed", "delivered"] },
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          itemId: { $toObjectId: "$products.item" },
        },
      },
      {
        $lookup: {
          from: "products", // Collection name for products
          localField: "itemId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $unwind: "$productDetails.Category", // Unwind the Category array
      },
      {
        $group: {
          _id: "$productDetails.Category",
          quantitySold: { $sum: "$products.quantity" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { quantitySold: -1 }, // Sort by quantity sold
      },
    ]);
    return result;
  } catch (error) {
    console.error("Error fetching top categories:", error);
  }
};

