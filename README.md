Esta documentação irá explicar como configurar o Asterisk para enviar dados e pacatos para o HEP server. Também irá explicar como fazer um HEP server do zero.

Todas estas configurações serão abordadas de maneira básica.

---

### Como criar e configurar o Asterisk para ser possível enviar os pacotes.

Primeiro é necessário instalar o Asterisk, para isso que se segue um breve passo-a-passo:

## 1º Passo | Instalação e configuração do Asterisk

Obs: Instalado numa maquina virtual linux Ubuntu

1º Ter a certeza que o pc server está atualizado e instalar as dependências (confirmar versões)

```bash
sudo apt-get update
sudo apt-get install -y build-essential libncurses5-dev libssl-dev libxml2-dev libsqlite3-dev uuid-dev libedit-dev libjansson-dev

```

2º Ir a pasta src da maquina para instalar o Asterisk.

```bash
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar zxvf astericdsk-20-current.tar.gz
cd asterisk-20.*
```

3º Depois do download e descomprimir o Asterisk está na hora de compilar a app e instalar

```bash
sudo ./configure #se faltar algum pacote de desenvolvimento será notificado aqui se tudo correr bem
```

Quando instalado com sucesso

```bash
sudo make menuselect #opcional apenas para verficar se os pacotes corretos estão instalados ou adicionar mais
sudo make
sudo make install
#depois de intalar
#estes codigos vão já criar ficheiros .conf dos pacotes acima selecionados
sudo make samples
sudo make config
sudo ldconfig
```

Instalação feita com sucesso. O próximo passo será a configuração do Asterisk.

```bash
cd /etc/asterisk
```

Agora dentro da pasta do Asterisk vamos iniciar uma configuração base para podermos ligar telefones ao serviço.

Apesar de termos vários ficheiros .conf apenas vamos trabalhar com os “extensions.conf”, “hep.conf” e “pjsip.conf”

obs: Todos os documentos estão bem documentos e ja com exemplos excelentes e podem ser usados bastando apenas 

Antes de começar-mos a escrever nos ficheiros acima aconselho a usar o comando:

```bash
sudo -s
```

Este comando ativa o superutilizador e assim fica mais fácil a alteração de código.

1º Vamos criar utilizadores para se poderem ligar ao nosso Asterisk. Vamos abrir o “pjsip.conf”:

```bash
nano pjsip.conf
```

Logo de inicio já podemos descomentar o transporte de UDP 

```bash
[transport-udp]
type=transport
protocol=udp
bind0.0.0.0.0:5060
local_net = 192.168.0.0/24
```

Em seguida podemos então configurar endpoints para pjsip telefones

```bash
[utilizador1]
type=endpoint
context=from-external
disallow=all
allow=ulaw
transport=transport-udp
auth=utilizador1-auth
aors=utilizador1-aor

[utilizador1-auth]
type=auth
auth_type=userpass
password=123
username=utilizador1

[utilizador1-aor]
type=aor
max_contacts=1
#=================
[utilizador2]
type=endpoint
context=from-external
disallow=all
allow=ulaw
transport=transport-udp
auth=utilizador2-auth
aors=utilizador2-aor

[utilizador2-auth]
type=auth
auth_type=userpass
password=123
username=utilizador2

[utilizador2-aor]
type=aor
max_contacts=1
```

Depois de escrever isto basta guardar o documento para avançarmos para o “extensions.conf”. 

Neste documento vamos criar o context que usamos nos utilizadores.

```bash
[from-external]
exten => utilizador1,1,Dial(PJSIP/utilizador1,20)
exten => utilizador1,n,Hangup()

exten => utilizador2,1,Dial(PJSIP/utilizador2,20)
exten => utilizador2,n,Hangup()
```

Depois de escrever isto basta guardar o documento para avançarmos para o “hep.conf”. 

Neste documento vamos configurar o HEP

```bash
[general]
enable = yes
capture_address = 127.0.0.1:9060 # IP do servidor HEP mais porta 
capture_name = HOME #para ser depois mais fácil encontrar os pacotes
uuid_type = call-id
```

E agora já podemos conectar os telefones ao Asterisk, basta executar o comando:

```jsx
asterisk -cvvv
```

## 2º Passo | HEP server

Aconselho a fazer setup do servidor HEP no mesmo ambiente que foi feita a instalação do Asterisk.

Este servidor foi feito em NODE JS por já haver [bibliotecas de suporte para está situação](https://www.npmjs.com/package/hep-js).

Antes de avançar por favor verifique que tem ja instalado VisualStudio (ou outra interface que consiga programar JavaScrpit), node e npm.

Depois ao abrir o VisualStudio vamos dar inicio a construção do servidor:

```jsx
npm init
//eu usei estas bibliotecas por favor verificar se algumas esta deprecada 
//ou se existe alternativa melhor
npm i drgam http socket.io hep-js
```

Este servidor vai ser responsável por receber e enviar os pacotes HEP vindos do Asterisk

Temos que ter atenção a porta e onde o servidor Asterisk esta hospedado.

Novamente este servidor foi feito no mesmo ambiente do Asterisk, por isso usamos o IP 127.0.0.1

Vamos começar primeiro por ver o que é necessário nesta transição de informação.

Eu aconselho por começarmos do mais simples até ao mais complexo.

Estrutura de pasta e documentos 

```scss
- src/
  - app.js        
  - udpServer.js  
  - httpServer.js 
  - decoderHEP.js
  - config.js
```

Irei começar pelo decoderHEP.js pois é o mais simples:

```jsx
import HEPjs from 'hep-js';

export function decodeHEPMessage(message) {
    const data = HEPjs.decapsulate(message);
    return { hep: data };
}

```

Usando já um função oferecida pela biblioteca a descodificação da mensagem fica mais rápido de fazer.

Seguindo para o udpServer.js e httpServer.js 

```jsx
import dgram from 'dgram';
import { decodeHEPMessage } from './hepHelper.js';
import { io } from './httpServer.js'; 

const udpServer = dgram.createSocket('udp4');

//Porta e IP que especificamos no hep.conf do Asterisk
const UDP_PORT = 9060; 
const UDP_HOST = '127.0.0.1'; 

udpServer.on('message', (message) => {
    const hepData = decodeHEPMessage(message);
    console.log(`Pacote HEP recebido`);
   
    io.emit('hep', hepData);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`Servidor HEP em ${address.address}:${address.port}`);
});

udpServer.on('error', (err) => {
    console.error(`Erro no servidor UDP: ${err.stack}`);
    udpServer.close();
});

udpServer.bind(UDP_PORT, UDP_HOST);

export default udpServer;

```

Vamos criar rapidamente o config.js para termos informação dos IPS e das portas lá 

Recomendo usarmos os ficheros .env para exemplo usaremos isto

```jsx
export const UDP_PORT = 9060;
export const UDP_HOST = '192.168.2.235';
export const WS_PORT = 1234;

```

```jsx
import http from 'http';
import {Server} from 'socket.io';
import udpServer from './udpServer.js';

const app = http.createServer();

const io = new Server(app, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET","POST"]
    }
});

const WS_PORT = 1234;

app.listen(WS_PORT, () => {
    console.log(`Servidor WebSocket a trabalhar em http://localhost:${WS_PORT}`);
});

export { app, io };

```

E por fim o app.js

```jsx
// app.js
import http from 'http';
import { app } from './httpServer.js'; // Importa 'app' do servidor HTTP
import udpServer from './udpServer.js';

// Criação do servidor HTTP
const httpServer = http.createServer(app);

export { app };

```

Uma nota importante no package.json não nos podemos esquecer de colocar duas anotações importantes o type e o start.

Exemplo:

```json
"type": "module",
"scripts":{
	"start": "node app.js"
	}
```

E assim damos por terminado as configurações e código feito no lado da virtual machine e podemos iniciar então as configurações na parte de cliente.

---

# Introdução e Configuração inicial do lado do Cliente / Recetor de pacotes HEP

Na parte de cliente iremos configurar a recepção dos pacotes HEP, retirar a informação mais importante e guardar numa base de dados para podermos liga-la ao Grafana.

Neste exemplo vou usar PostgresSQL para guardar os dados.

Antes de começar verificar se tem instalado no cliente/host Docker, docker-compose, Nodejs, npm e alguma interface que permita conexão com o PostegreSQl (por exemplo DBeaver).

## 1º Passo | docker-compose

Neste exemplo vou usar o PostgresSQL 13 pois é o que estou mais habituado

```yaml
volumes:
  postgres_data:

networks:
  grafanahep:
    driver: bridge

services:
  postgres:
    image: postgres:13
    container_name: ${Nome para aparecer no Docker:-postegres}
    environment:
      POSTGRES_USER: ${Nome_do_Utilizador:-postegres}
      POSTGRES_PASSWORD: ${Palavra_Passe_do_Utilizador:-postegres}
      POSTGRES_DB: ${Nome_da_Base_de_Dados:-postegres}
    ports:
      - "5432:5432" #Portas default do postgres
    networks:
      - grafanahep
    volumes:
      - postgres_data:/var/lib/postgresql/data

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    networks:
      - grafanahep

# Para poder instalar este docker-compose 
# docker-compose up -d
```

Depois de executar isto já se pode fazer ligação ao DBeaver.

## 2º Passo | Organização de ficheiros

Também no lado do cliente podemos ter algo semelhante ao do servidor em termos de organização de código e de ficheiros:

```scss
- src/
  - app.js        
  - database.js
  - queries.js
  - socketClient.js
  - utils.js
```

## 3º Passo | Código

Novamente vou começar do ficheiro mais simples até ao app.js

Vamos começar pelo ficheiro que permite a ligação ao WebServer que esta no mesmo ambiente do Asterisk

```jsx
//socketClient.js
import { io } from "socket.io-client";

const socket = io(`http://${IP_HTTP_SERVER}:${PORT_UDP_SERVER}`);

export default socket;
```

Tendo em conta que a criação da base de dados ja foi feira no docker-compose, segue-se o código de configuração

```jsx
//database.js
import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "container",
  password: "admin",
  port: 5432,
});
```

Já tendo o ficheiro anterior completo podemos ja preparar a query para criar a tabela na base de dados:

```jsx
//queries.js
import { pool } from "./database.js";

export async function createJsonDataTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS json_data (
      id SERIAL PRIMARY KEY, 
      type VARCHAR, 
      rcinfo VARCHAR, 
      srcIp VARCHAR,  
      dstIp VARCHAR, 
      srcPort VARCHAR, 
      dstPort VARCHAR, 
      payload VARCHAR, 
      via VARCHAR, 
      call_id VARCHAR, 
      "from" VARCHAR, 
      "to" VARCHAR, 
      "date" VARCHAR, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    const result = await pool.query(queryText);
    console.log("Tabela criada com sucesso");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
}
/*
Legenda: 
	- type: Se o dado é um registo, um invite, etc...
	- rcinfo: Proveniente do metodo de "decapsulate" do HEP-JS
	- srcIp: Source IP
	- dstIp: Destination IP
	- srcPort: Source Port
	- dstPort: Destination Port
	- payload: Proveniente do metodo de "decapsulate" do HEP-JS
	- via: 
	- call_id: O ID da chamada
	- from: Mostra o nome ou numero associado ao IP que esta a fazer a chamada
	- to: Mostra o nome ou numero associado ao IP que esta a receer a chamada
	- date: Informação opcional que vem dentro do payload
	- created_at: Campo que preenche automaticamente a data de inserção dos dados na tabel
*/
```

Em seguida o utils.js. Este ficheiro serviu para colocar duas funções para poderemos fazer a divisão da informação que vem no payload do HEP para assim depois podermos preencher os campos da tabela. 

```jsx
export function extractFieldFromPayload(payload, fieldName) {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, "i");
  const match = payload.match(regex);
  return match ? match[1].trim() : null;
}

export function extractFristLineFromPayload(payload) {
  const regex = new RegExp("^\\s*(.*)", "i");
  const match = payload.match(regex);
  return match ? match[1].trim() : null;
}
```

Por fim basta apenas o app.js responsável por receber e gerir tudo

```jsx
//app.js
import socket from "./socketClient.js";
import { createJsonDataTable } from "./queries.js";
import { extractFieldFromPayload, extractFristLineFromPayload } from "./utils.js";
import { pool } from "./database.js";

socket.on("connect", () => {
  console.log("Conectado ao servidor WebSocket");
  createJsonDataTable();
});

socket.on("hep", async (message) => {
  const { hep } = message;
  const { rcinfo, payload } = hep;
  const { srcPort, dstPort, srcIp, dstIp } = rcinfo;

  const type = extractFristLineFromPayload(payload);
  const via = extractFieldFromPayload(payload, 'Via');
  const call_id = extractFieldFromPayload(payload, 'Call-ID');
  const from = extractFieldFromPayload(payload, 'From');
  const to = extractFieldFromPayload(payload, 'To');
  const date = extractFieldFromPayload(payload, 'Date');

  const queryText = `
    INSERT INTO json_data 
      (type, rcinfo, srcIp, dstIp, srcPort, dstPort, payload, via, call_id, "from", "to", "date") 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  try {
    const result = await pool.query(queryText, [type, rcinfo, srcIp, dstIp, srcPort, dstPort, payload, via, call_id, from, to, date]);
    console.log("Dados salvos com sucesso");
  } catch (err) {
    console.error("Erro ao salvar dados:", err);
  }
});

socket.on("error", (error) => {
  console.log("Erro do servidor:", error);
});

socket.on("disconnect", () => {
  console.log("Desconectado do servidor WebSocket");
});

```

E assim dou por concluído a configuração do recetor de pacotes HEP e a sua devida inserção na base de dados

---

# Configuração do Grafana

No inicio do último capítulo, no docker-compose, já deixamos preparado o Grafana.
O Grafana fica a funcionar na porta 3000 podendo aceder através de http://localhost:3000.

Para fazer login usamos “admin” tanto no nome de utilizador como na palavra-passe.

![Grafana's Login Page](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fb7ddc6a0-0f5b-4044-8542-2411835b3088%2F5b588794-c056-49b6-b259-8daccd90af42%2FUntitled.png?table=block&id=f5c476ce-d5be-49f8-b81b-310e29f8e3f9&spaceId=b7ddc6a0-0f5b-4044-8542-2411835b3088&width=2000&userId=63f50c09-1f04-49e6-8042-b386504eb09f&cache=v2)

## 1º Passo | Associar uma Data Source ao Grafana

Antes de adionarmos uma Data Source teremos que também instalar um plugin

No nosso lado esquerdo temos um menu vertical onde podemos selecionar o menu de plugins

 
![Untitled](<img width="272" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/dec633b3-619f-451e-871d-b67404c8def1">)

Dentro desse menu teremos que pesquisar pelo plugin do PostegreSQL

![Untitled](<img width="746" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/f7809a60-5497-4bf4-bd43-3e51ed4fb0c2">)

Ao aceder ao PostegreSQL Core poderemos já adicionar a data source e nela teremos vários campos para preencher.

Neste campo por exemplo podemos escolher um nome

![Untitled](<img width="638" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/e24a34db-4226-4785-b2f3-42adf5c2835b">)

Em seguida podemos preencher essas informações, mas atenção os dados tem que ser iguais aos que estão on docker-compose.

Atenção o host URL tem que ser com o gateway do docker (se estiver a usar docker)

![Untitled](<img width="363" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/f51e8aa6-bc5e-4d8b-a6b9-8757a767851d">)

Se o TLS não estiver configurado pode desabilitar

para ver o gateway do docker tem que copiar referencia do container e escrever na consola

```bash
docker inspect <Referencia_do_container>
```

Antes de confirmar verificar a versão, ao escrever isto o Grafana deixa por defeito a versão 9 do PostgreSQL

![Untitled](<img width="383" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/b78095d8-2327-4650-a5c2-e2ffa7e0efb8">)

No final terá uma mensagem positiva em termos de conexão do Grafana ao PostegreSQL

![Untitled](<img width="1714" alt="image" src="https://github.com/PedroBarge/SendHepToGrafana/assets/148236408/0ceaf53a-d21e-4431-97d3-aa7f8de6dcf5">)

---
