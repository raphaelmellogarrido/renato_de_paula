<?php
require __DIR__. '/_conexao.php';
$email = 'raphaelmellogarrido@gmail.com';
echo "PRESENCAS:<br>";
$r = $mysqli->query("SELECT * FROM presencas WHERE email = '$email' ORDER BY data DESC LIMIT 5");
while($row = $r->fetch_assoc()){ print_r($row); echo "<br>"; }

echo "<br>PROGRESSO:<br>";
$r2 = $mysqli->query("SELECT * FROM progresso_aulas_raiz WHERE email = '$email' ORDER BY arquivo DESC LIMIT 5");
while($row = $r2->fetch_assoc()){ print_r($row); echo "<br>"; }