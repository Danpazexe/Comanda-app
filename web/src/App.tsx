import React, { useEffect, useState } from 'react';
import { listenToComandas, StatusComanda } from './services/firebase';
import { PedidoMonitor } from './types/Comanda';
import './App.css';

const App: React.FC = () => {
  const [pedidosPreparando, setPedidosPreparando] = useState<PedidoMonitor[]>([]);
  const [pedidosProntos, setPedidosProntos] = useState<PedidoMonitor[]>([]);

  // Calcular pedidos que vão para direita (não cabem no centro)
  const pedidosParaDireita = pedidosProntos.length > 4 ? pedidosProntos.slice(0, -4).reverse() : [];

  useEffect(() => {
    // Escutar comandas em preparação
    const unsubPrep = listenToComandas(StatusComanda.PREPARANDO, (pedidos) => {
      setPedidosPreparando(pedidos);
    });

    // Escutar comandas prontas
    const unsubPronto = listenToComandas(StatusComanda.PRONTO, (pedidos) => {
      setPedidosProntos(pedidos);
    });

    return () => {
      unsubPrep();
      unsubPronto();
    };
  }, []);

  const renderLista = (lista: PedidoMonitor[]) => {
    return lista.length === 0 ? (
      <div className="placeholder">—</div>
    ) : (
      lista.map((p) => (
        <div key={p.id} className="nome-lateral">{p.nomeCliente}</div>
      ))
    );
  };

  const renderCentro = () => {
    if (pedidosProntos.length === 0) {
      return (
        <div className="box-branco box-centro">
          <div className="centro-topo">
            <div className="placeholder">—</div>
          </div>
          <div className="centro-base">
            <div className="centro-quad"></div>
            <div className="centro-quad"></div>
            <div className="centro-quad"></div>
          </div>
        </div>
      );
    }

    // LÓGICA: Máximo 4 pedidos no centro (1 gigante + 3 baixo), resto vai para direita
    const pedidosCentro = pedidosProntos.slice(-4); // Últimos 4

    const ultimoChamado = pedidosCentro[pedidosCentro.length - 1]; // Último da lista (PEDIDO 6)
    const anteriores = pedidosCentro.slice(0, -1); // 3 anteriores (PEDIDO 3, 4, 5)

    return (
      <div className="box-branco box-centro">
        {/* Nome principal gigante, bem no meio - SEMPRE o último chamado */}
        <div className="centro-topo">
          <div className="nome-gigante">
            {ultimoChamado.nomeCliente}
          </div>
        </div>

        {/* Três quadrados embaixo - pedidos anteriores chamados */}
        <div className="centro-base">
          {[0, 1, 2].map((i) => (
            <div key={i} className="centro-quad">
              {anteriores[i] && (
                <div className="nome-secundario">
                  {anteriores[i].nomeCliente}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="tela-azul">
      <div className="linha">
        {/* ESQUERDA */}
        <div className="col-wrap">
          <div className="titulo-esq">EM PREPARAÇÃO</div>
          <div className="box-branco box-lateral">
            <div className="scroll-container">
              {renderLista(pedidosPreparando)}
            </div>
          </div>
        </div>

        {/* CENTRO */}
        <div className="col-wrap col-centro">
          <div className="titulo-centro">SEU PEDIDO ESTÁ PRONTO</div>
          {renderCentro()}
        </div>

        {/* DIREITA */}
        <div className="col-wrap">
          <div className="titulo-dir">JÁ CHAMADOS</div>
          <div className="box-branco box-lateral">
            <div className="scroll-container">
              {renderLista(pedidosParaDireita)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
