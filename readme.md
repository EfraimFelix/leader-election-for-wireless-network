# Eleição de Líder em Ambientes Sem-Fio

Este é um código que implementa um algoritmo de eleição de líder em ambientes sem-fio, onde é imaginado que não há falhas de processo nem de rede. O propósito principal é eleger um líder entre os processos em uma rede, considerando pesos associados a cada processo. O líder é escolhido com base em um critério de peso, onde o processo com o maior peso é eleito como líder.

## Funcionalidades

O código oferece as seguintes funcionalidades:

1. **Iniciar um Processo:**

   - O código inicia um processo em uma porta específica, com um peso associado.

2. **Iniciar uma Eleição:**

   - O processo pode iniciar uma eleição, informando para seus vizinhos sobre a eleição de um líder.

3. **Responder à Eleição:**

   - Os processos respondem à eleição informando o processo com o maior peso conhecido.

4. **Liderança Propagada:**

   - Uma vez que o líder é escolhido, a informação sobre o líder é propagada para os vizinhos.

5. **Eleição Única:**
   - Caso tenha sido iniciado duas eleições sem que haja o término da outra, apenas uma se manterá ativa enquanto a outra será descartada. Para testar essa funcionalidade foi colocado um delay na propagação da eleição de 3s para que se consiga iniciar duas eleições sem que uma termine antes da outra começar.

## Como Executar com pm2

   O pm2 é um gerenciador de processos e é acoselhavel usa-lo na execução deste projeto devido ao grande numeros de processos que deve ser mantido em execução.

1. **Instalar Dependências:**

   - Certifique-se de ter o Node.js instalado. Você pode instalar as dependências do projeto utilizando o comando:
     ```bash
     npm install
     ```

2. **Instalar pm2:**

   - Você pode instalar o pm2 utilizando o seguinte comando:
     ```bash
     npm install pm2@latest -g
     ```

3. **Executar o Código:**

   - Execute o código para cada processo em uma porta diferente, passando o ID (porta do processo) do processo como argumento da linha de comando. Por exemplo:
     ```bash
     pm2 start index.js -n ProcessoID -- ID
     ```
     `-n ProcessoID` define um nome para o processo e `ID` é o argumento passado para o algoritmo.
     Certifique-se de ajustar o número da ID conforme consta no objeto `allProcessInfo`.

4. **Gerenciando os processos:**

   - Você pode usar os seguintes comandos para iniciar, parar e monitorar todos os processos:
     ```bash
     pm2 start all
     ```
     ```bash
     pm2 stop all
     ```
     ```bash
     pm2 monit
     ```

5. **Iniciando eleição:**

- Use a seguinte rota para iniciar uma eleição dentro do sistema:
  - `http://localhost:ID/startElection`: Inicia uma eleição no processo.
    Ajuste o valor de ID para o número correspondente ao processo no qual você deseja iniciar a eleição.

## Observações

- Certifique-se de ajustar as informações sobre os vizinhos e pesos associados a cada processo no objeto `allProcessInfo` conforme a topologia desejada.

- O código utiliza o Express.js para criar um servidor web para cada processo, permitindo a comunicação entre eles.

- O processo com o maior ID ganha em caso de empate no peso.

- A liderança é propagada pelos processos, garantindo que todos os processos estejam cientes do líder atual.

- Todos os processos devem estar ativos para a execução correta do algoritmo.
