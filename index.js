// Eleição de líder em ambientes sem-fio

const axios = require("axios");
const express = require("express");
const app = express();

app.use(express.json());

const allProcessInfo = {
  /* A*/ 3001: { weight: 4, neighbors: ["3002", "3010"] },
  /* B*/ 3002: { weight: 6, neighbors: ["3001", "3003", "3007"] },
  /* C*/ 3003: { weight: 3, neighbors: ["3002", "3004", "3005"] },
  /* D*/ 3004: { weight: 2, neighbors: ["3003", "3005", "3006"] },
  /* E*/ 3005: { weight: 1, neighbors: ["3003", "3004", "3006"] },
  /* F*/ 3006: { weight: 4, neighbors: ["3004", "3005", "3009"] },
  /* G*/ 3007: { weight: 2, neighbors: ["3002", "3005", "3008", "3010"] },
  /* H*/ 3008: { weight: 8, neighbors: ["3007", "3009"] },
  /* I*/ 3009: { weight: 5, neighbors: ["3006", "3008"] },
  /* J*/ 3010: { weight: 4, neighbors: ["3001", "3007"] },
};

const processId = process.argv[2];
const baseUrl = "http://localhost";
const port = processId;
const delay = 3000;

const processInfo = allProcessInfo[processId];
const neighbors = processInfo.neighbors;
const weight = processInfo.weight;

let parentProcess = null;
let inElection = false;
let childProcess = [];
let childResponses = [];
let electionBy = null;
let leaderProcess = null;

app.listen(port, async () => {
  await sleep(delay);
  console.log(`Processo de id ${processId} foi iniciado com peso ${weight}!`);
});

app.get("/startElection", (req, res) => {
  startElection();
  res.send();
});

app.get("/clearLog", (req, res) => {
  console.clear();
  res.send();
});

app.get("/requestElection", async (req, res) => {
  // resetando leaderProcess para nova eleição

  // Definindo um delay de 3 segundos, para teste de eleições paralelas
  await sleep(3000)

  leaderProcess = null;
  if (parentProcess == null) {
    console.log(`Em eleição ... Iniciado por ${req.body.electionBy} `);
    //Nao tem pai
    noHasParent(req);
  } else {
    //Tem pai
    hasParent(req);
  }
  res.send();
});

app.get("/responseElection", (req, res) => {
  console.log(
    `Possivel melhor processo é o ${req.body.bestProcess.processId} com peso ${req.body.bestProcess.weight}, informado pelo no ${req.body.processId}`
  );

  childResponses.push({
    processId: req.body.bestProcess.processId,
    weight: req.body.bestProcess.weight,
  });

  // console.log(`Qtd filhos ${childProcess.length} - Qtd respostas ${childResponses.length}`)

  //Caso tenha filhos, e todos eles responderam
  if (childProcess.length == childResponses.length) {
    if (electionBy == processId) {
      // caso este processo seja a raiz da arvore

      //Adicionando o proprio processo para verificar o "melhor"
      childResponses.push({ processId, weight });
      //Ordenando os processos
      sortProcess();

      console.log(`Defininindo lider como ${childResponses[0].processId}`);

      leaderProcess = childResponses[0].processId;
      leaderPropagation(leaderProcess);
      resetMetadata(false);
    } else {
      // caso o processo seja apenas um no "comum" da arvore
      console.log(`Enviando melhor processo ${childResponses[0].processId} para o pai`);

      //Adicionando o proprio processo para verificar o "melhor"
      childResponses.push({ processId, weight });
      //Ordenando os processos
      sortProcess();

      axiosRequest(parentProcess, "responseElection", {
        processId,
        bestProcess: {
          processId: childResponses[0].processId,
          weight: childResponses[0].weight,
        },
      });
    }
  }

  res.send();
});

app.get("/isNotParent", (req, res) => {
  console.log(`Retirando o processo ${req.body.processId} da lista de filhos`);
  childProcess.splice(childProcess.indexOf(req.body.processId), 1);

  if (childProcess.length == 0) {
    axiosRequest(parentProcess, "responseElection", {
      processId,
      bestProcess: { processId, weight },
    });
  }
  res.send();
});

app.get("/leader", (req, res) => {
  // Caso o lider ja tenha sido definido ele nao devera ser propagado
  if (leaderProcess != null) {
    res.send();
    return;
  }

  console.log(
    `Definindo o lider como ${req.body.leaderProcess}, informado por ${req.body.processId}`
  );

  leaderPropagation(req.body.leaderProcess);

  leaderProcess = req.body.leaderProcess;

  // resetando dados, menos o lider
  resetMetadata(false);

  res.send();
});

function resetMetadata(resetLeader) {
  if (resetLeader == true) {
    leaderProcess = null;
  }

  parentProcess = null;
  inElection = false;
  childProcess = [];
  childResponses = [];
  electionBy = null;
}

function startElection() {
  if (inElection) return;

  leaderProcess = null;
  inElection = true;
  electionBy = processId;

  console.log(`Processo ${processId} iniciou eleição`);

  electionPropagation();

  inElection = false;
}

function hasParent(req) {
  // se iniciar um outra eleição a eleição inciado pelo processo com maior id ganha
  // Logo o processo que recebeu a elição de maior valor deve nomear um novo pai e propagar a nova eleição
  if (electionBy < req.body.electionBy) {
    console.log(`Escolhendo eleição do processo ${req.body.electionBy}`);
    // Resetando dados para nova eleição
    resetMetadata(true);
    noHasParent(req);
    return;
  }

  // console.log(`Ja tenho pai: ${parentProcess}`);

  axiosRequest(req.body.processId, "isNotParent", { processId });
}

async function noHasParent(req) {
  console.log(`Definindo ${req.body.processId} como pai`);
  parentProcess = req.body.processId;
  electionBy = req.body.electionBy;

  electionPropagation();

  if (childProcess.length == 0) {
    axiosRequest(parentProcess, "responseElection", {
      processId,
      bestProcess: { processId, weight },
    });
  }
}

function electionPropagation() {
  neighbors.forEach((neighbor) => {
    if (neighbor != parentProcess) {
      childProcess.push(neighbor);
      axiosRequest(neighbor, "requestElection", {
        processId,
        electionBy: electionBy,
      });
    }
  });
}

function leaderPropagation(leaderProcess_) {
  neighbors.forEach((neighbor) => {
    if (neighbor != parentProcess) {
      console.log(`Propagando lider ${leaderProcess_} para ${neighbor}`);
      axiosRequest(neighbor, "leader", {
        processId,
        leaderProcess: leaderProcess_,
      });
    }
  });
}

async function axiosRequest(port, path, data) {
  await axios(`${baseUrl}:${port}/${path}`, {
    data: data,
  }).catch(function (error) {});
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortProcess() {
  childResponses.sort((b, a) => {
    // Primeiro, compare os pesos (weight)
    if (a.weight !== b.weight) {
      return a.weight - b.weight;
    }

    // Se houver empate no peso, desempate pelo processId
    return a.processId - b.processId;
  });
}
