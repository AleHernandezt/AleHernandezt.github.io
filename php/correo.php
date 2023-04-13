<?php

if (isset($_POST['enviar'])) {
    if (!empty($_POST['name'])&& !empty($_POST['email'])&& !empty($_POST['number'])&& !empty($_POST['msg'])) {
        $name = $_POST['name'];
        $email = $_POST['email'];
        $number = $_POST['number'];
        $msg = $_POST['msg'];
        $header = "From: noreply@example.com" ."\r\n";
        $header .= "Reply-to: noreply@example.com" ."\r\n";
        $header .="X-Mailer: PHP/" . phpversion();
        $mail = @mail($email, $number, $msg, $header);
        if ($mail){
            echo "<h4>Send</h4>";
        }
    }
}