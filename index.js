const { transform, csv } = require("./src/index")

csv('Datum;Einzelwert\n"08.07.2019 00:00";7,40\n"08.07.2019 00:15";7,80\n')
.then((data) => {
  console.log(transform(data))
})
